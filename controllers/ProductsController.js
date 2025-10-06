import Controllers from "../core/Controllers.js";
import ProductsModel from "../models/ProductsModel.js";
import CategoriesController from "../controllers/CategoriesController.js";
import CountersController from "../controllers/CountersController.js";
import InventoriesController from "../controllers/InventoriesController.js";
import fs from "fs";
import multer from "multer";
import persianDate from "persian-date";
import PurchaseInvoicesController from "./PurchaseInvoicesController.js";
import PropertiesController from "./PropertiesController.js";
import { ObjectId } from "mongodb";
import InputsController from "./InputsController.js";
import BrandsModel from "../models/BrandsModel.js";

const filesPath = "public/products/";
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      new ObjectId().toString() + "." + file.mimetype.split("/")[1];
    cb(null, uniqueSuffix);
  },
});
const fileFilter = (req, file, cb) => {
  let allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
  cb(null, allowedTypes.includes(file.mimetype));
};
const uploadProductFiles = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {fileSize: 5000000},
}).array("files");

class ProductsController extends Controllers {
  static model = new ProductsModel();

  constructor() {
    super();
  }

  static createTheStoragePath() {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(filesPath)) {
          fs.mkdirSync(filesPath, {recursive: true});
          console.log(`Products Storage Path was created successfully.`);
        }

        return resolve({
          code: 200,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static setVariantsTitleBasedOnProperty($propertyId) {
    return new Promise((resolve, reject) => {
      this.model
        .list(
          {
            "variants.properties._property": $propertyId,
          },
          {
            select: "_id variants title",
          }
        )
        .then(
          async (listOfProducts) => {
            for (const product of listOfProducts) {
              for (const variant of product.variants) {
                variant.title = this.createVariantTitle(product.title, variant);
              }

              await this.model.updateOne(product._id, {
                variants: product.variants,
              });
            }

            return resolve({
              code: 200,
            });
          },
          (response) => {
            return reject(response);
          }
        );
    });
  }

  static async createVariantTitle($productName, $variant) {
    let title = $productName;
    for (const property of $variant.properties) {
      let propertyDetail = await PropertiesController.get({
        _id: property._property,
      });
      propertyDetail = propertyDetail.data;
      let value = propertyDetail.values.find(
        (value) => value.code === property.value
      );
      title += " " + value.title;
    }
    return title;
  }

  static async outputBuilder($row) {
    for (const [$index, $value] of Object.entries($row)) {
      switch ($index) {
        case "updatedAt":
          let updatedAtJalali = new persianDate($value);
          $row[$index + "Jalali"] = updatedAtJalali.toLocale("fa").format();
          break;
        case "createdAt":
          let createdAtJalali = new persianDate($value);
          $row[$index + "Jalali"] = createdAtJalali.toLocale("fa").format();
          break;
      case "files":
          if (Array.isArray($value) && $value.length) {
            const base = (process.env.STATICS_URL || "/").replace(/\/+$/, "");
            const prefix = `${base}/products/`;
            $row.files = $value.map((name) => `${prefix}${name}`);
          }
          break;
        case "_id":
          let priceOfProduct = await InventoriesController.getProductPrice({
            _id: $value,
          });
          if (priceOfProduct.data.consumer) $row["price"] = priceOfProduct.data;
          break;
        case "variants":
          for (const variant of $value) {
            let priceOfVariant = await InventoriesController.getProductPrice({
              _id: variant._id,
            });
            if (priceOfVariant.data.consumer) {
              variant.price = priceOfVariant.data;
            }
          }
          break;
      }
    }

    return $row;
  }

  static queryBuilder($input) {
    let $query = {};

    this.detectPaginationAndSort($input);

    $query["status"] = BrandsModel.statuses.ACTIVE;

    for (const [$index, $value] of Object.entries($input)) {
      switch ($index) {
        case "title":
          $input["$or"] = [
            {title: {$regex: ".*" + $value + ".*"}},
            {"variants.title": {$regex: ".*" + $value + ".*"}},
          ];
          delete $input["title"];
          break;
        case "statuses":
          if ($input.user.data.role === "admin") {
            let $arrayOfValue = $value.split(",");
            let $statuses = [];

            $arrayOfValue.forEach((status) => {
              if (!isNaN(status)) {
                $statuses.push(Number(status));
              }
            });

            if ($statuses.length > 1) {
              $query["status"] = {$in: $statuses};
            }
          }
          break;
      }
    }

    return $query;
  }

  static uploadFile($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          _id: {type: "mongoId", required: true},
        });

        const product = await this.model.get($input._id);

        uploadProductFiles($input.req, $input.res, async (err) => {
          if (err) {
            return reject({
              code: 500,
              data: err,
            });
          }

          if (!product.files) {
            product.files = [];
          }

          $input.req.files.forEach((file) => {
            product.files.push(file.filename);
          });

          await product.save();

          return resolve({
            code: 200,
          });
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static deleteFile($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          _id: {type: "mongoId", required: true},
        });

        const product = await this.model.get($input._id, {
          select: "_id files",
        });

        if (product.files.length && product.files.includes($input.fileName)) {
          await fs.unlinkSync(filesPath + $input.fileName);

          product.files.splice(product.files.indexOf($input.fileName), 1);

          await product.save();

          return resolve({
            code: 200,
          });
        } else {
          return reject({
            code: 404,
          });
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  static deleteVariant($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          _id: {type: "mongoId", required: true},
          _variant: {type: "mongoId", required: true},
        });

        const product = await this.model.get($input._id);

        await PurchaseInvoicesController.item(
          {"products._id": $input._variant},
          {select: "_id"}
        ).then(
          (purchaseInvoices) => {
            return reject({
              code: 400,
              data: {
                message:
                  "It is not possible to remove the product variant." +
                  " Because it is used in the purchase invoice",
              },
            });
          },
          async (response) => {
            if (response.code === 404) {
              product.variants.splice(
                product.variants.indexOf(
                  product.variants.find(
                    (variant) => variant._id === $input._variant
                  )
                ),
                1
              );

              await product.save();

              return resolve({
                code: 200,
              });
            } else {
              return reject({
                code: 500,
              });
            }
          }
        );
      } catch (error) {
        return reject(error);
      }
    });
  }

  static insertOne($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          name: {type: "string", required: true},
          _categories: {
            type: "array",
            minItemCount: 1,
            items: {
              type: "mongoId",
            },
          },
          _brand: {type: "mongoId", required: true},
          _unit: {type: "mongoId", required: true},
          barcode: {type: "string"},
          iranCode: {type: "string"},
          weight: {type: "number"},
          tags: {type: "string"},
          properties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {type: "string"},
                _id: {type: "mongoId"},
              },
            },
          },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                properties: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      _property: {type: "mongoId"},
                      value: {type: "number"},
                    },
                  },
                },
              },
            },
          },
          dimensions: {
            type: "object",
            properties: {
              length: {type: "number"},
              width: {type: "number"},
            },
          },
          title: {type: "string"},
          content: {type: "string"},
        });

        let category = await CategoriesController.get({
          _id: $input._categories[0],
        });
        $input.code = Number(
          category.data.code +
            "" +
            (await CountersController.increment(
              "Category No. " + category.data.code + " products"
            ))
        );

        if ($input.variants) {
          for (let variant of $input.variants) {
            variant.code = Number(
              category.data.code +
                "" +
                (await CountersController.increment(
                  "Category No. " + category.data.code + " products"
                ))
            );

            variant.title = await this.createVariantTitle(
              $input.title,
              variant
            );
          }
        }

        if (!$input.dimensions) {
          $input.dimensions = {
            width: 0,
            length: 0,
          };
        }

        let response = await this.model.insertOne({
          name: $input.name,
          code: $input.code,
          _categories: $input._categories,
          _brand: $input._brand,
          _unit: $input._unit,
          barcode: $input.barcode,
          iranCode: $input.iranCode,
          weight: $input.weight,
          tags: $input.tags,
          properties: $input.properties,
          variants: $input.variants,
          dimensions: $input.dimensions,
          title: $input.title,
          content: $input.content,
          status: ProductsModel.statuses.ACTIVE,
          _user: $input.user.data._id,
        });

        response = await this.outputBuilder(response.toObject());

        return resolve({
          code: 200,
          data: response,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static products($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          title: {type: "string"},
          statuses: {type: "string"},
          perPage: {type: "number"},
          page: {type: "number"},
          sortColumn: {type: "string"},
          sortDirection: {type: "number"},
        });

        if ($input.statuses) {
          $input.statuses = $input.statuses
            .split(",")
            .map(s => Number(s.trim()))
            .filter(Boolean);
        }

        if (!$input.sortColumn || $input.sortColumn === "") {
          delete $input.sortColumn;
        }

        let $query = this.queryBuilder({data: $input});

        if ($input.statuses?.length) {
          $query.status = {$in: $input.statuses};
        }

        const list = await this.model.list($query, {
          skip: $input.offset,
          limit: $input.perPage,
          sort: $input.sort,
        });

        const count = await this.model.count($query);

        for (const row of list) {
          const index = list.indexOf(row);
          list[index] = await this.outputBuilder(row.toObject());
        }

        return resolve({
          code: 200,
          data: {
            list,
            total: count,
            page: $input.page,
            perPage: $input.perPage,
          },
        });
      } catch (error) {
        console.error("❌ products error:", error);
        return reject(error);
      }
    });
  }

  static updateOne($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          _id: {type: "mongoId", required: true},
          name: {type: "string", required: true},
          _categories: {
            type: "array",
            minItemCount: 1,
            items: {
              type: "mongoId",
            },
          },
          _brand: {type: "mongoId", required: true},
          _unit: {type: "mongoId", required: true},
          barcode: {type: "string"},
          iranCode: {type: "string"},
          weight: {type: "number"},
          tags: {type: "string"},
          properties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {type: "string"},
                _id: {type: "mongoId"},
              },
            },
          },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                properties: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      _property: {type: "mongoId"},
                      value: {type: "number"},
                    },
                  },
                },
              },
            },
          },
          dimensions: {
            type: "object",
            properties: {
              length: {type: "number"},
              width: {type: "number"},
            },
          },
          title: {type: "string"},
          content: {type: "string"},
        });

        if ($input.variants) {
          let category = await CategoriesController.get({
            _id: $input._categories[0],
          });
          for (let variant of $input.variants) {
            if (!variant.code)
              variant.code = Number(
                category.data.code +
                  "" +
                  (await CountersController.increment(
                    "Category No. " + category.data.code + " products"
                  ))
              );

            variant.title = await this.createVariantTitle(
              $input.title,
              variant
            );
          }
        }

        if (!$input.dimensions) {
          $input.dimensions = {
            width: 0,
            length: 0,
          };
        }

        let response = await this.model.updateOne($input._id, {
          name: $input.name,
          _categories: $input._categories,
          _brand: $input._brand,
          _unit: $input._unit,
          barcode: $input.barcode,
          iranCode: $input.iranCode,
          weight: $input.weight,
          tags: $input.tags,
          properties: $input.properties,
          variants: $input.variants,
          dimensions: $input.dimensions,
          title: $input.title,
          content: $input.content,
        });

        response = await this.outputBuilder(response.toObject());

        return resolve({
          code: 200,
          data: response,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static setStatus($input) {
    return new Promise(async (resolve, reject) => {
      try {
        InputsController.validateInput($input, {
          _id: {type: "mongoId", required: true},
          status: {
            type: "number",
            allowedValues: Object.values(ProductsModel.statuses),
            required: true,
          },
        });

        await this.model.updateOne($input._id, {
          status: $input.status,
        });

        return resolve({
          code: 200,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static deleteOne($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          _id: {type: "mongoId", required: true},
        });

        let product = await this.model.get($input._id, {select: "_id files"});

        if (product.files) {
          for (const file of product.files) {
            await fs.unlinkSync(filesPath + file);
          }
        }

        await product.deleteOne();

        return resolve({
          code: 200,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static latest($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          limit: {type: "number"},
        });

        let $limit = Number($input.limit ?? 10);
        if (isNaN($limit) || $limit <= 0) $limit = 10;
        if ($limit > 50) $limit = 50;

        const $query = {status: ProductsModel.statuses.ACTIVE};
        const list = await this.model.list($query, {
          limit: $limit,
          sort: {createdAt: -1},
        });

        for ( const row of list) {
          const index = list.indexOf(row);
          list[index] = await this.outputBuilder(row.toObject());
        }

        return resolve({
          code: 200,
          data: list,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static getByCategory($input) {
    return new Promise(async (resolve, reject) => {
      try {
        await InputsController.validateInput($input, {
          categoryId: {type: "mongoId", required: true},
          limit: {type: "number"},
        });

        let $limit = Number($input.limit ?? 10);
        if (isNaN($limit) || $limit <= 0) $limit = 10;

        const $query = {
          status: ProductsModel.statuses.ACTIVE,
          _categories: new ObjectId($input.categoryId)
        };

        const list = await this.model.list($query, {
          limit: $limit,
          sort: {createdAt: -1},
        });

        for (const row of list) {
          const index = list.indexOf(row);
          list[index] = await this.outputBuilder(row.toObject());
        }

        return resolve({
          code: 200,
          data: list,
        });
      } catch (error) {
        console.error("❌ getByCategory error:", error);
        return reject(error);
      }
    });
  }
}

export default ProductsController;
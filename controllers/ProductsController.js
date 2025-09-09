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

// config upload service
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
  // check allowed type
  let allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
  cb(null, allowedTypes.includes(file.mimetype));
};
const uploadProductFiles = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5000000 },
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
          // create the path
          fs.mkdirSync(filesPath, { recursive: true });
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
      // update every product has variant with this property
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
            // update every
            for (const product of listOfProducts) {
              // create variant title
              for (const variant of product.variants) {
                // create variant title
                variant.title = this.createVariantTitle(product.title, variant);
              }

              // update product
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
          // set price of product
          let priceOfProduct = await InventoriesController.getProductPrice({
            _id: $value,
          });
          if (priceOfProduct.data.consumer) $row["price"] = priceOfProduct.data;
          break;
        case "variants":
          for (const variant of $value) {
            // set price of variant
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

    // pagination
    this.detectPaginationAndSort($input);

    // set the default status for search
    $query["status"] = BrandsModel.statuses.ACTIVE;

    for (const [$index, $value] of Object.entries($input)) {
      switch ($index) {
        case "title":
          $input["$or"] = [
            { title: { $regex: ".*" + $value + ".*" } },
            { "variants.title": { $regex: ".*" + $value + ".*" } },
          ];
          delete $input["title"];
          break;
        case "statuses":
          // check if its admin
          if ($input.user.data.role === "admin") {
            // convert statuses to array
            let $arrayOfValue = $value.split(",");
            let $statuses = [];

            // add each status
            $arrayOfValue.forEach((status) => {
              // if status is a valid number
              if (!isNaN(status)) {
                // add to array
                $statuses.push(Number(status));
              }
            });

            // set the filed for query
            if ($statuses.length > 1) {
              $query["status"] = { $in: $statuses };
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
          _id: { type: "mongoId", required: true },
        });

        // get product
        const product = await this.model.get($input._id);

        // upload product files
        uploadProductFiles($input.req, $input.res, async (err) => {
          if (err) {
            return reject({
              code: 500,
              data: err,
            });
          }

          // create array of files
          if (!product.files) {
            product.files = [];
          }

          // add file Names to the list
          $input.req.files.forEach((file) => {
            product.files.push(file.filename);
          });

          // save product
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
        // validate input
        await InputsController.validateInput($input, {
          _id: { type: "mongoId", required: true },
        });

        // get the product files detail
        const product = await this.model.get($input._id, {
          select: "_id files",
        });

        // check file is exiting
        if (product.files.length && product.files.includes($input.fileName)) {
          // delete File
          await fs.unlinkSync(filesPath + $input.fileName);

          // remove file from files list
          product.files.splice(product.files.indexOf($input.fileName), 1);

          // save the product
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
        // validate input
        await InputsController.validateInput($input, {
          _id: { type: "mongoId", required: true },
          _variant: { type: "mongoId", required: true },
        });

        const product = await this.model.get($input._id);

        // find purchase-invoices with this product
        await PurchaseInvoicesController.item(
          { "products._id": $input._variant },
          { select: "_id" }
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
              // delete variant from product
              product.variants.splice(
                product.variants.indexOf(
                  product.variants.find(
                    (variant) => variant._id === $input._variant
                  )
                ),
                1
              );

              // save product
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
          name: { type: "string", required: true },
          _categories: {
            type: "array",
            minItemCount: 1,
            items: {
              type: "mongoId",
            },
          },
          _brand: { type: "mongoId", required: true },
          _unit: { type: "mongoId", required: true },
          barcode: { type: "string" },
          iranCode: { type: "string" },
          weight: { type: "number" },
          tags: { type: "string" },
          properties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                _id: { type: "mongoId" },
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
                      _property: { type: "mongoId" },
                      value: { type: "number" },
                    },
                  },
                },
              },
            },
          },
          dimensions: {
            type: "object",
            properties: {
              length: { type: "number" },
              width: { type: "number" },
            },
          },
          title: { type: "string" },
          content: { type: "string" },
        });

        // product code
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

        // variants
        if ($input.variants) {
          for (let variant of $input.variants) {
            variant.code = Number(
              category.data.code +
                "" +
                (await CountersController.increment(
                  "Category No. " + category.data.code + " products"
                ))
            );

            // create variant title
            variant.title = await this.createVariantTitle(
              $input.title,
              variant
            );
          }
        }

        // dimensions
        if (!$input.dimensions) {
          $input.dimensions = {
            width: 0,
            length: 0,
          };
        }

        // filter
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

        // create output
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
        // validate Input
        await InputsController.validateInput($input, {
          title: { type: "string" },
          statuses: { type: "string" },
          perPage: { type: "number" },
          page: { type: "number" },
          sortColumn: { type: "string" },
          sortDirection: { type: "number" },
        });

        // check filter is valid and remove other parameters (just valid query by user role) ...
        let $query = this.queryBuilder($input);
        // get list
        const list = await this.model.list($query, {
          skip: $input.offset,
          limit: $input.perPage,
          sort: $input.sort,
        });

        // get the count of properties
        const count = await this.model.count($query);

        // create output
        for (const row of list) {
          const index = list.indexOf(row);
          list[index] = await this.outputBuilder(row.toObject());
        }

        // return result
        return resolve({
          code: 200,
          data: {
            list: list,
            total: count,
            page: $input.page,
            perPage: $input.perPage,
          },
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  static updateOne($input) {
    return new Promise(async (resolve, reject) => {
      try {
        // validate input
        await InputsController.validateInput($input, {
          _id: { type: "mongoId", required: true },
          name: { type: "string", required: true },
          _categories: {
            type: "array",
            minItemCount: 1,
            items: {
              type: "mongoId",
            },
          },
          _brand: { type: "mongoId", required: true },
          _unit: { type: "mongoId", required: true },
          barcode: { type: "string" },
          iranCode: { type: "string" },
          weight: { type: "number" },
          tags: { type: "string" },
          properties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                _id: { type: "mongoId" },
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
                      _property: { type: "mongoId" },
                      value: { type: "number" },
                    },
                  },
                },
              },
            },
          },
          dimensions: {
            type: "object",
            properties: {
              length: { type: "number" },
              width: { type: "number" },
            },
          },
          title: { type: "string" },
          content: { type: "string" },
        });

        // variants
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

            // create variant title
            variant.title = await this.createVariantTitle(
              $input.title,
              variant
            );
          }
        }

        // dimensions
        if (!$input.dimensions) {
          $input.dimensions = {
            width: 0,
            length: 0,
          };
        }

        // filter
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

        // create output
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
        // validate $input
        InputsController.validateInput($input, {
          _id: { type: "mongoId", required: true },
          status: {
            type: "number",
            allowedValues: Object.values(ProductsModel.statuses),
            required: true,
          },
        });

        // set the status
        await this.model.updateOne($input._id, {
          status: $input.status,
        });

        // return result
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
        // validate input
        await InputsController.validateInput($input, {
          _id: { type: "mongoId", required: true },
        });

        // get the product
        let product = await this.model.get($input._id, { select: "_id files" });

        // delete files
        if (product.files) {
          for (const file of product.files) {
            await fs.unlinkSync(filesPath + file);
          }
        }

        // delete the product
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
        // validate input
        await InputsController.validateInput($input, {
          limit: { type: "number" },
        });

        // determine limit (default 10, max 50)
        let $limit = Number($input.limit ?? 10);
        if (isNaN($limit) || $limit <= 0) $limit = 10;
        if ($limit > 50) $limit = 50;

        // only active products, sort by createdAt desc
        const $query = { status: ProductsModel.statuses.ACTIVE };
        const list = await this.model.list($query, {
          limit: $limit,
          sort: { createdAt: -1 },
        });

        // enrich output
        for (const row of list) {
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
}

export default ProductsController;

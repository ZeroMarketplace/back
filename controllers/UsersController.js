import Controllers from "../core/Controllers.js";
import PermissionsController from "./PermissionsController.js";
import UsersModel from "../models/UsersModel.js";
import Logger from "../core/Logger.js";
import HelpersController from "./HelpersController.js";
import InputsController from "./InputsController.js";
import AuthController from "./AuthController.js";
import persianDate from "persian-date";

class UsersController extends Controllers {
  static model = new UsersModel();

  constructor() {
    super();
  }

  static queryBuilder($input) {
    let $query = {};

    // pagination
    this.detectPaginationAndSort($input);

    for (const [$index, $value] of Object.entries($input)) {
      switch ($index) {
        case "phone":
          $query[$index] = { $regex: ".*" + $value + ".*" };
          break;
        case "name":
          // Split the full name into words
          const names = $value.split(" ");

          // List of search conditions
          let conditions = [];

          // Search assuming all words are in `first`
          conditions.push({
            firstName: { $regex: names.join(" "), $options: "i" },
          });

          // Search assuming all words are in `last`
          conditions.push({
            lastName: { $regex: names.join(" "), $options: "i" },
          });

          // Search assuming the first word is in `first` and the rest in `last`
          if (names.length > 1) {
            conditions.push({
              $and: [
                { firstName: { $regex: names[0], $options: "i" } },
                {
                  lastName: { $regex: names.slice(1).join(" "), $options: "i" },
                },
              ],
            });

            // Search assuming the first word is in `last` and the rest in `first`
            conditions.push({
              $and: [
                {
                  firstName: {
                    $regex: names.slice(1).join(" "),
                    $options: "i",
                  },
                },
                { lastName: { $regex: names[0], $options: "i" } },
              ],
            });
          }

          $query["$or"] = conditions;
          break;
      }
    }

    return $query;
  }

  static insertOne($input) {
    return new Promise(async (resolve, reject) => {
      try {
        // check filter is valid ...
        await InputsController.validateInput($input, {
          firstName: { type: "string", required: true },
          lastName: { type: "string", required: true },
          phone: { type: "phone" },
          email: { type: "email" },
          password: { type: "string" },
        });

        // check method of signup
        if (!$input.phone && !$input.email) {
          return reject({
            code: 400,
            data: {
              message: "Please enter a valid phone number or email address",
            },
          });
        }

        let user = {};

        // check user exists
        await this.model
          .item({
            $or: [{ phone: $input.phone ?? "" }, { email: $input.email ?? "" }],
          })
          .then(
            (userFound) => {
              user = userFound;
            },
            (err) => {
              // do nothing
            }
          );

        // if user found. return user
        if (user._id) {
          return resolve({
            code: 200,
            data: user,
          });
        }

        // Set Name
        user.firstName = $input.firstName;
        user.lastName = $input.lastName;

        // set phone
        if ($input.phone) {
          user.phone = $input.phone;
        }

        // set email
        if ($input.email) {
          user.email = $input.email;
        }

        // set validated
        if ($input.validated) {
          user.validated = $input.validated;
        }

        // set password
        if ($input.password) {
          await AuthController.hashPassword($input.password).then(
            (password) => {
              user.password = password;
            }
          );
        }

        // set color
        user.color = HelpersController.generateRandomColor();

        // set role
        user.role = "user";

        // set status
        user.status = "active";

        // set user permission
        const usersDefaultPermission =
          await PermissionsController.getUsersDefaultPermissions();
        user._permissions = usersDefaultPermission.data._id;

        let response = await this.model.insertOne(user);

        response = await this.outputBuilder(response.toObject());

        return resolve({
          code: 200,
          data: response,
        });
      } catch (err) {
        return reject(err);
      }
    });
  }

  static users($input) {
    return new Promise(async (resolve, reject) => {
      try {
        // validate Input
        await InputsController.validateInput($input, {
          title: { type: "string" },
          perPage: { type: "number" },
          page: { type: "number" },
          sortColumn: { type: "string" },
          sortDirection: { type: "number" },
        });

        let query = this.queryBuilder($input);

        let options = {
          sort: $input.sort,
          skip: $input.offset,
          limit: $input.perPage,
          projection: {
            password: 0,
          },
        };

        // get the items
        let list = await this.model.list(query, options);

        // get count of items
        const count = await this.model.count(query);

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
          firstName: { type: "string", required: true },
          lastName: { type: "string", required: true },
          color: { type: "string", required: true },
        });

        // update db
        let response = await this.model.updateOne($input._id, {
          firstName: $input.firstName,
          lastName: $input.lastName,
          color: $input.firstName,
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

  static setPassword($id, $input) {
    return new Promise((resolve, reject) => {
      // check filter is valid ...
      AuthController.hashPassword($input.password).then(
        (password) => {
          // filter
          this.model
            .updateOne($id, {
              password: password,
            })
            .then(
              (response) => {
                // check the result ... and return
                return resolve({
                  code: 200,
                });
              },
              (response) => {
                return reject(response);
              }
            );
        },
        (error) => {
          return reject(error);
        }
      );
    });
  }

  static update($filter, $input) {
    return new Promise(async (resolve, reject) => {
      // filter
      this.model.update($filter, $input).then(
        (response) => {
          // check the result ... and return
          return resolve(response);
        },
        (response) => {
          return reject(response);
        }
      );
    });
  }

  static async initDefaultAdminUser() {
    try {
      let adminUser = await this.model
        .item({
          role: "admin",
        })
        .catch((error) => {});

      if (adminUser) {
        console.log("Admin user already exists");
        return;
      }

      let adminPermissions = await PermissionsController.model
        .item({
          title: "adminsDefaultPermissions",
        })
        .catch((error) => {
          console.log("Error getting admin permissions:", error);
          throw error;
        });

      if (!adminPermissions) {
        throw new Error(
          "Admin permissions not found. Please run initDefaultPermissions first."
        );
      }

      let adminUserData = {
        firstName: "Admin",
        lastName: "User",
        phone: "09121231212",
        email: "admin@zeromarketplace.com",
        password: "admin@A123",
        role: "admin",
        status: "active",
        color: "#FF6B6B",
        _permissions: adminPermissions._id,
      };

      let hashedPassword = await AuthController.hashPassword(
        adminUserData.password
      );
      adminUserData.password = hashedPassword;

      await this.model.insertOne(adminUserData);

      console.log("Default admin user created successfully");
      console.log("Username: admin");
      console.log("Password: admin123");
      console.log("Please change the password after first login");
    } catch (error) {
      console.log("Error in creating default admin user:", error);
      throw error;
    }
  }
}

export default UsersController;

// create the storage path
import AccountingDocumentsController from "./AccountingDocumentsController.js";
import Controllers from "../core/Controllers.js";
import AccountsController from "./AccountsController.js";
import ProductsController from "./ProductsController.js";
import PermissionsController from "./PermissionsController.js";
import SettingsController from "./SettingsController.js";
import MessagesController from "./MessagesController.js";
import UsersController from "./UsersController.js";

class ServerSetupController extends Controllers {
  constructor() {
    super();
  }

  static async initializeRequirements() {
    try {
      // init users permissions
      await PermissionsController.initDefaultPermissions();

      // init default admin user
      await UsersController.initDefaultAdminUser();

      // create the storage path of accounting documents
      await AccountingDocumentsController.createTheStoragePath();

      // init the Global Accounts
      await AccountsController.initGlobalAccounts();

      // create the storage path of products
      await ProductsController.createTheStoragePath();

      // create the settings
      await SettingsController.initSystemSettings();

      // create the storage path of products
      await MessagesController.createTheStoragePath();
    } catch (error) {
      console.log(error);
    }
  }
}

export default ServerSetupController;

// create the storage path
import AccountingDocumentsController from "./AccountingDocumentsController.js";
import Controllers                   from "../core/Controllers.js";
import AccountsController            from "./AccountsController.js";
import ProductsController            from "./ProductsController.js";
import PermissionsController         from "./PermissionsController.js";

class ServerSetupController extends Controllers {
    constructor() {
        super();
    }

    static async initializeRequirements() {
        try {
            // init users permissions
            await PermissionsController.initDefaultPermissions();

            // create the storage path of accounting documents
            await AccountingDocumentsController.createTheStoragePath();

            // init the Global Accounts
            await AccountsController.initGlobalAccounts();

            // create the storage path of products
            await ProductsController.createTheStoragePath();

        } catch (error) {
            console.log(error);
        }
    }
}

export default ServerSetupController;
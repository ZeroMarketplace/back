import Controllers from "../core/Controllers";
const AccountsModel = require("./models/AccountsModel");

class AccountsController extends Controllers {
    constructor() {
        super();
        this.model = new AccountsModel();
    }

    asyncFunc() {

    }

    getAll(inputs) {

        let validQueryFields = ['title', 'type', 'balance', 'description'];
        let query            = {};
        inputs.forEach((inputValue, inputFiled) => {
            if (validQueryFields.includes(inputFiled)) {
                query[inputFiled] = inputValue;
            }
        });
    }

}

export default AccountsController;
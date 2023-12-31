import Controllers   from "../core/controllers";
import AccountsModel from "../models/accountsModel";

class AccountsController extends Controllers {
    constructor() {
        super();
        this.model = new AccountsModel();
        this.model.collection.findOne({});
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
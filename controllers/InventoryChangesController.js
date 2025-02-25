import Controllers           from '../core/Controllers.js';
import InventoryChangesModel from '../models/InventoryChangesModel.js';
import InventoriesController from "./InventoriesController.js";
import InputsController      from "./InputsController.js";

class InventoryChangesController extends Controllers {
    static model = new InventoryChangesModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // insert to db
                let response = await this.model.insertOne({
                    type      : $input.type,
                    changes   : $input.changes,
                    _reference: $input._reference,
                });

                // return result
                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get inventory Changes
                let inventoryChanges = await this.model.get($input._id);

                // return updates in inventories
                await InventoriesController.returnUpdatesByInventoryChanges({
                    _id: $input._id,
                    inventoryChanges: inventoryChanges
                });

                // delete the inventory change
                await inventoryChanges.deleteOne();

                return resolve({
                    code: 200
                });
            }
            catch (error) {
                return reject(error);
            }
        });
    }

}

export default InventoryChangesController;

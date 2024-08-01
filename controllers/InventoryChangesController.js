import Controllers           from '../core/Controllers.js';
import InventoryChangesModel from '../models/InventoryChangesModel.js';
import InventoriesController from "./InventoriesController.js";

class InventoryChangesController extends Controllers {
    static model = new InventoryChangesModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.insertOne({
                type   : $input.type,
                changes: $input.changes
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static list($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.list($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: response
                        }
                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title: {
                    en: $input.title.en,
                    fa: $input.title.fa
                }
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // get inventory Changes
            this.model.get($id).then(
                async (inventoryChanges) => {

                    for (const change of inventoryChanges.changes) {
                        switch (change.operation) {
                            case 'update':
                                let setValue           = {};
                                setValue[change.field] = change.oldValue;
                                await InventoriesController.update({_id: change._inventory}, setValue);
                                break
                            case 'insert':
                                await InventoriesController.deleteOne(change._inventory);
                                break;
                        }
                    }

                    await inventoryChanges.deleteOne();

                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }


}

export default InventoryChangesController;

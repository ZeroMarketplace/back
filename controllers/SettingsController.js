import Controllers      from '../core/Controllers.js';
import SettingsModel    from '../models/SettingsModel.js';
import InputsController from "./InputsController.js";
import persianDate      from "persian-date";

class SettingsController extends Controllers {
    static model = new SettingsModel();

    constructor() {
        super();
    }

    static initSystemSettings() {
        return new Promise(async (resolve, reject) => {
            try {
                // init system settings array
                const systemSettings = [
                    {
                        key    : 'pricingMethod',
                        title  : 'روش قیمت‌گذاری محصولات',
                        type   : 'select',
                        value  : 'fifo',
                        options: [
                            {
                                key  : 'lifo',
                                title: 'بر اساس آخرین فاکتور خرید'
                            },
                            {
                                key  : 'fifo',
                                title: 'بر اساس اولین فاکتور خرید (اسلامی)'
                            },
                            {
                                key  : 'max',
                                title: 'بر اساس بالاترین قیمت فاکتور‌ها'
                            },
                            {
                                key  : 'weightedAverage',
                                title: 'بر اساس میانگین وزنی فاکتورهای خرید'
                            }
                        ]
                    }
                ];

                for (const setting of systemSettings) {
                    await this.model.item({
                        key: setting.key
                    }).then(
                        (foundedSetting) => {
                        },
                        async (error) => {
                            if (error.code === 404) {
                                // insert the account
                                await this.model.insertOne(setting);
                            } else {
                                console.log(error);
                            }
                        }
                    );
                }

                return resolve({
                    code: 200
                });
            } catch (err) {
                console.log(err);
                return reject({
                    code: 500,
                    data: {
                        message: err
                    }
                });
            }
        });
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'updatedAt':
                    let updatedAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = updatedAtJalali.toLocale('fa').format();
                    break;
                case 'createdAt':
                    let createdAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = createdAtJalali.toLocale('fa').format();
                    break;
            }
        }

        return $row;
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = $input.sortDirection;
        } else {
            $input.sort = {createdAt: -1};
        }

        Object.entries($input).forEach((field) => {
            // field [0] => index
            // field [1] => value
            switch (field[0]) {
                case 'title':
                    $query[field[0]] = {$regex: '.*' + field[1] + '.*'};
                    break;
            }
        });

        return $query;
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    title: {type: "string", required: true}
                });

                // insert to db
                let response = await this.model.insertOne({
                    title : $input.title,
                    status: 'active',
                    _user : $input.user.data._id
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (error) {
                return reject(error);
            }
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

    static settings($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                // await InputsController.validateInput($input, {
                //     title        : {type: "string"},
                //     perPage      : {type: "number"},
                //     page         : {type: "number"},
                //     sortColumn   : {type: "string"},
                //     sortDirection: {type: "number"},
                // });

                // check filter is valid and remove other parameters (just valid query by user role) ...
                // let $query = this.queryBuilder($input);
                // get list
                // const list = await this.model.list(
                //     $query,
                //     {
                //         skip : $input.offset,
                //         limit: $input.perPage,
                //         sort : $input.sort
                //     }
                // );

                const list = await this.model.list();

                // get the count of properties
                const count = await this.model.count();

                // create output
                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row.toObject());
                }

                // return result
                return resolve({
                    code: 200,
                    data: {
                        list : list,
                        total: count
                    }
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static get($input, $options) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    key: {type: 'string', required: true}
                });

                // get from db
                let response = await this.model.item({key: $input.key}, $options);

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
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
                    _id: {type: 'mongoId', required: true}
                });

                // get the setting
                let response = await this.model.get($input._id);

                // validate value
                if ($input.value) {
                    switch (response.type) {
                        case 'select':
                            await InputsController.validateInput($input, {
                                value: {
                                    type         : 'string',
                                    allowedValues: response.options.map(i => i.key)
                                }
                            });
                            break;
                        case 'string':
                            await InputsController.validateInput($input, {
                                value: {type: 'string'}
                            });
                            break;
                        case 'number':
                            await InputsController.validateInput($input, {
                                value: {type: 'number'}
                            });
                            break;
                        case 'boolean':
                            await InputsController.validateInput($input, {
                                value: {type: 'boolean'}
                            });
                            break;
                    }
                } else {
                    return resolve({
                        code: 400,
                        data: {
                            message: 'Validation error',
                            errors : ['value is required']
                        }
                    });
                }

                // set the value
                response.value = $input.value;
                await response.save();

                // create output
                response = await this.outputBuilder(response.toObject());

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

                // delete from db
                await this.model.deleteOne($input._id);

                // return result
                return resolve({
                    code: 200
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

}

export default SettingsController;

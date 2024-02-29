const Controllers           = require('../core/Controllers');
const PermissionsController = require('./PermissionsController');
const UsersModel            = require('../models/UsersModel');
const {response}            = require("express");
const Logger                = require("../core/Logger");

class UsersController extends Controllers {
    static model = new UsersModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // get permissions for add to new user
            PermissionsController.getUsersDefaultPermissions().then(
                (responseDefaultPermission) => {
                    // filter
                    this.model.insertOne({
                        phone       : $input.phone,
                        password    : $input.password,
                        validated   : $input.validated,
                        role        : 'user',
                        status      : 'active',
                        _permissions: responseDefaultPermission.data.id
                    }).then(
                        (response) => {
                            // check the result ... and return
                            return resolve({
                                code: 200,
                                data: response
                            });
                        },
                        (error) => {
                            return reject(error);
                        });
                },
                (error) => {
                    Logger.systemError('AUTH-Permissions', error);
                    return reject({
                        code: 500
                    });
                }
            );
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
                    console.log(error);
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
            this.model.updateOne($id, {}).then(
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

    static deleteOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($input).then(response => {
                // check the result ... and return
                return resolve(response);
            }).catch(response => {
                return reject(response);
            });
        });
    }

}

module.exports = UsersController;
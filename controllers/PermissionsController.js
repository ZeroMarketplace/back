import Controllers      from '../core/Controllers.js';
import PermissionsModel from '../models/PermissionsModel.js';

class PermissionsController extends Controllers {
    static model = new PermissionsModel();

    constructor() {
        super();
    }

    static async initDefaultPermissions() {
        try {

            let admin = {
                "title": "adminsDefaultPermissions",
                "type" : "collective",
                "label": "admins",
                "urls" : {
                    "/api/users"               : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/units"               : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true,
                        "PATCH" : true
                    },
                    "/api/brands"              : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true,
                        "PATCH" : true,
                    },
                    "/api/properties"          : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true,
                        "PATCH" : true
                    },
                    "/api/categories"          : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true,
                        "PATCH" : true
                    },
                    "/api/products"            : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true,
                        "PATCH" : true
                    },
                    "/api/warehouses"          : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true,
                        "PATCH" : true
                    },
                    "/api/accounts"            : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true,
                        "PATCH" : true
                    },
                    "/api/add-and-subtract"    : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/purchase-invoices"   : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/accounting-documents": {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/settlements"         : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/sales-invoices"      : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/inventories"         : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/stock-transfers"     : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/settings"            : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/contacts"            : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/conversations"       : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/commodity-profits"   : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                }
            };

            let user = {
                "title": "usersDefaultPermissions",
                "type" : "collective",
                "label": "users",
                "urls" : {
                    "/api/contacts"     : {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/conversations": {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                },
            };

            let adminsPermission = await this.model.item({
                title: 'adminsDefaultPermissions',
                type : 'collective',
                label: 'admins'
            }).catch((error) => {
                // do nothing
            });

            let usersPermission = await this.model.item({
                title: 'usersDefaultPermissions',
                type : 'collective',
                label: 'users'
            }).catch((error) => {
                // do nothing
            });

            // insert users permission
            if (!usersPermission) {
                await this.model.insertOne(user);
            } else {
                if (usersPermission.urls !== user.urls) {
                    usersPermission.urls = user.urls;
                    await usersPermission.save();
                }
            }

            // insert users permission
            if (!adminsPermission) {
                await this.model.insertOne(admin);
            } else {
                if (adminsPermission.urls !== admin.urls) {
                    adminsPermission.urls = admin.urls;
                    await adminsPermission.save();
                }
            }

        } catch (error) {
            console.log('error in setting default permissions');
            throw error;
        }
    }

    static getUsersDefaultPermissions() {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item({
                label: 'users'
            }).then(
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

}

export default PermissionsController;

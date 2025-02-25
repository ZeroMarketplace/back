import Controllers      from '../core/Controllers.js';
import InputsController from "./InputsController.js";
import UsersController  from "./UsersController.js";

class ContactsController extends Controllers {

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    phone: {type: 'string', required: true}
                });

                // search in db to find the contact's user
                let contactUser = await UsersController.item(
                    {phone: $input.phone},
                    {select: '_id'}
                );
                // get the data of user
                contactUser     = contactUser.data;

                // check if contact is user self
                if (contactUser._id.toString() === $input.user.data._id) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'You cannot add yourself as a contact'
                        }
                    });
                }

                // find the user self
                let user = await UsersController.get(
                    {_id: $input.user.data._id},
                    {select: '_id contacts'},
                    'model'
                );
                // get the data of user
                user     = user.data;

                // check the contact is exist
                if (user.contacts && user.contacts.includes(contactUser._id.toString())) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'This contact has already been added'
                        }
                    });
                } else {
                    // add the contact
                    user.contacts.push(contactUser._id);
                    // save the user
                    await user.save()

                    // return result
                    return resolve({
                        code: 200
                    });
                }
            } catch (error) {
                return reject(error);
            }
        });
    }

    static contacts($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // get all contacts
                let user = await UsersController.get(
                    {_id: $input.user.data._id},
                    {
                        select  : 'contacts',
                        populate: [
                            {path: 'contacts', select: '_id firstName lastName avatars color'},
                        ]
                    }
                );

                // get the data of user
                let list = user.data.contacts;

                // create output
                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row);
                }

                // return result
                return resolve({
                    code: 200,
                    data: {
                        list : list,
                        total: list.length
                    }
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default ContactsController;

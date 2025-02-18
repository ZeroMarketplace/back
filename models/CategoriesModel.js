import Models     from '../core/Models.js';
import {Schema}   from 'mongoose';
import Logger     from '../core/Logger.js';
import {ObjectId} from 'mongodb';

class CategoriesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title        : String,
            code         : Number,
            profitPercent: {type: Number, default: undefined},
            _properties  : {type: [{type: Schema.Types.ObjectId, ref: 'properties'}], default: undefined},
            _parent      : {type: Schema.Types.ObjectId, default: undefined},
            children     : {type: [{type: Schema.Types.ObjectId, ref: 'categories'}], default: undefined},
            status       : {type: String, enum: ['active', 'inactive']},
            _user        : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('categories', CategoriesModel.schema);
    }

    addChild($id, $childId) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findById(new ObjectId($id)).then(
                (response) => {
                    // add child id to children array
                    if (response.children) {
                        response.children.push($childId);
                    } else {
                        response.children = [$childId];
                    }
                    // save parent document
                    response.save().then(
                        (responseSave) => {
                            return resolve({
                                code: 200,
                                data: responseSave
                            });
                        },
                        (error) => {
                            Logger.systemError('Categories-AddChild-SaveChild', error);
                            return reject({
                                code: 500
                            });
                        },
                    );

                },
                (error) => {
                    Logger.systemError('Categories-AddChild', error);
                    return reject({
                        code: 500
                    });
                }
            );
        });
    }

    deleteOne($id) {
        return new Promise(async (resolve, reject) => {
            try {
                // find the category
                const category = await this.collectionModel.findById($id);

                // handle not found
                if(!category) {
                    return reject({
                        code: 404
                    })
                }

                // find all category children
                const children = await this.collectionModel.aggregate([
                    {
                        $match: {_id: new ObjectId($id)} // find the base category
                    },
                    {
                        $graphLookup: {
                            from            : "categories", // collection name
                            startWith       : "$_id", // start with _id
                            connectFromField: "_id", // the key of children identification
                            connectToField  : "_parent", // key to connect parent
                            as              : "allChildren" // all children in array
                        }
                    },
                    {
                        $project: {
                            _id        : 0, // the _id of parents
                            allChildren: "$allChildren._id" // the all _id of children
                        }
                    }
                ]);

                // has a child
                if (children.length > 0) {
                    // delete all children
                    await this.collectionModel.deleteMany({
                        _id: {$in: children[0].allChildren},
                    });
                }

                // update parent children
                if (category._parent) {
                    const parent = await this.collectionModel.findById(category._parent);
                    // update parent
                    parent.children.splice(parent.children.indexOf($id), 1);
                    await parent.save();
                }

                // delete the category
                await category.deleteOne();

                return resolve({
                    code: 200
                });


            } catch (error) {
                return reject({
                    code: 500,
                    data: {errors: [error]}
                });
            }
        });
    }

}

export default CategoriesModel;

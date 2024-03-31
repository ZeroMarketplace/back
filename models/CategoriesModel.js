const Models   = require("../core/Models");
const {Schema} = require("mongoose");
const Logger   = require("../core/Logger");

class CategoriesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title        : {
                en: String,
                fa: String
            },
            code         : Number,
            profitPercent: Number,
            _properties  : [{type: Schema.Types.ObjectId, ref: 'properties'}],
            _parent      : String,
            children     : [String],
            status       : {type: String, enum: ['active', 'inactive']},
            _user        : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('categories', CategoriesModel.schema);
    }

    addChild($id, $childId) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findById($id).then(
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
        return new Promise((resolve, reject) => {
            this.collectionModel.findById($id).then(
                async (category) => {

                    // delete sub categories
                    await this.collectionModel.removeMany({
                        id: {$in: category.children ?? []}
                    });


                    // update parent children
                    if (category._parent) {
                        await this.collectionModel.findById(category._parent).then(
                            async (parentsResponse) => {
                                // update parent
                                parentsResponse.children.splice(parentsResponse.children.indexOf($id), 1);
                                await parentsResponse.save();

                            }
                        );
                    }

                    // at end remove the category
                    category.remove().then(
                        (response) => {
                            return resolve({
                                code: 200
                            });
                        },
                        (error) => {
                            Logger.systemError('DB-Delete-Category-remove', error);
                            return reject({
                                code: 500
                            });
                        },
                    );


                },
                (error) => {
                    Logger.systemError('DB-Delete-Category-Find', error);
                    return reject({
                        code: 404
                    });
                }
            );
        });
    }

}

module.exports = CategoriesModel;
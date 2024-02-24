let express                = require('express');
let router                 = express.Router();
const InputsController     = require("../controllers/InputsController");
const CategoriesController = require("../controllers/CategoriesController");
const AuthController       = require("../controllers/AuthController");

router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created category
        $input.user = req.user;

        CategoriesController.insertOne($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        CategoriesController.list($input).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.put(
    '/:id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        // add author to created category
        $input.user = req.user;

        CategoriesController.updateOne($params.id, $input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.delete(
    '/:id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        CategoriesController.deleteOne($params.id).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

module.exports = router;

// router.post(
//     '/',
//     authenticateToken,
//     checkAdminAccess,
//     body('title').notEmpty(),
//     body('titleEn').notEmpty(),
//     validateInputs,
//     async function (req, res, next) {
//         let insertArr = {
//             title  : req.body.title,
//             titleEn: req.body.titleEn,
//             code   : await getNextSequence("categories")
//         };
//
//         // create properties object id
//         if (req.body._properties) {
//             req.body._properties.forEach((property, index) => {
//                 req.body._properties[index] = new ObjectId(property);
//             });
//             insertArr['_properties'] = req.body._properties;
//         }
//
//
//         if (req.body.icon) insertArr['icon'] = req.body.icon;
//         if (req.body._parent) insertArr['_parent'] = new ObjectId(req.body._parent);
//
//         categoriesCollection.insertOne(insertArr).then((result) => {
//
//             // add to categorize children
//             categoriesCollection.updateOne(
//                 {_id: insertArr['_parent']},
//                 {$push: {children: new ObjectId(result.insertedId)}}
//             );
//
//             return res.sendStatus(result.acknowledged ? 200 : 400);
//         });
//     }
// );
//
// router.get(
//     '/',
//     function (req, res) {
//         categoriesCollection.find()
//             .toArray().then((result) => {
//             res.json(reformatCategories(result));
//         });
//     }
// );
//
// router.get(
//     '/:_id/properties',
//     param('_id').notEmpty(),
//     function (req, res) {
//         let _id = new ObjectId(req.params._id);
//         // check exists
//         categoriesCollection.findOne({_id: _id}).then(findResult => {
//             if (findResult) {
//                 propertiesCollection.find({_id: {$in: findResult._properties}})
//                     .toArray()
//                     .then((result) => {
//                         res.json(result);
//                     });
//             } else {
//                 return res.sendStatus(404);
//             }
//         });
//     }
// );
//
//
// router.put(
//     '/:_id',
//     authenticateToken,
//     checkAdminAccess,
//     body('title').notEmpty(),
//     body('titleEn').notEmpty(),
//     param('_id').notEmpty(),
//     validateInputs,
//     async function (req, res, next) {
//         let _id = new ObjectId(req.params._id);
//         // check exists
//         categoriesCollection.findOne({_id: _id}).then(findResult => {
//             if (findResult) {
//                 let updateArr = {
//                     title  : req.body.title,
//                     titleEn: req.body.titleEn,
//                 };
//
//                 // create properties object id
//                 if (req.body._properties) {
//                     req.body._properties.forEach((property, index) => {
//                         req.body._properties[index] = new ObjectId(property);
//                     });
//                     updateArr['_properties'] = req.body._properties;
//                 }
//
//                 if (req.body.icon) updateArr['icon'] = req.body.icon;
//
//                 categoriesCollection.updateOne(
//                     {_id: _id},
//                     {$set: updateArr}
//                 ).then((result) => {
//                     return res.sendStatus(result.acknowledged ? 200 : 400);
//                 });
//             } else {
//                 return res.sendStatus(404);
//             }
//         });
//
//
//     }
// );
//
// router.delete(
//     '/:_id',
//     authenticateToken,
//     checkAdminAccess,
//     param('_id').notEmpty(),
//     validateInputs,
//     async function (req, res, next) {
//         let _id = new ObjectId(req.params._id);
//         let childrenIds;
//
//         // check exists
//         categoriesCollection.findOne({_id: _id}).then(findResult => {
//             if (findResult) {
//                 // get all children
//                 categoriesCollection.find().project({_id: 1, children: 1}).toArray().then((result) => {
//                     childrenIds = findChildrenIds(result, _id);
//                 }).then(() => {
//                     // delete category
//                     categoriesCollection.deleteOne({
//                         _id: _id
//                     }).then((result) => {
//
//                         // delete category children
//                         categoriesCollection.deleteMany({_id: {$in: childrenIds}});
//
//                         // update children of parent
//                         categoriesCollection.updateOne(
//                             {children: {$in: [_id]}},
//                             {$pull: {children: _id}}
//                         ).then((result) => {
//                             return res.sendStatus(200);
//                         });
//
//                     });
//                 });
//             } else {
//                 return res.sendStatus(404);
//             }
//         });
//
//     }
// );

module.exports = router;
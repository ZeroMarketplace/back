let express            = require('express');
let router             = express.Router();
const InputsController = require("../controllers/InputsController");
const PropertiesController  = require("../controllers/PropertiesController");
const AuthController   = require("../controllers/AuthController");

router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created property
        $input.user = req.user;

        PropertiesController.insertOne($input).then(
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

        PropertiesController.list($input).then(
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

        // add author to created property
        $input.user = req.user;

        PropertiesController.updateOne($params.id, $input).then(
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

        PropertiesController.deleteOne($params.id).then(
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
//     body('variant').isBoolean(),
//     validateInputs,
//     async function (req, res, next) {
//         // create code for values
//         for (let value of req.body.values) {
//             value.code = await getNextSequence('properties-values', true)
//         }
//
//         propertiesCollection.insertOne(
//             {
//                 title  : req.body.title,
//                 titleEn: req.body.titleEn,
//                 variant: req.body.variant,
//                 values : req.body.values
//             }
//         ).then((result) => {
//             return res.sendStatus(result.acknowledged ? 200 : 400);
//         });
//     }
// );
//
// router.get(
//     '/',
//     function (req, res) {
//         propertiesCollection.find().toArray().then((result) => {
//             res.json(result);
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
//     body('variant').isBoolean(),
//     param('_id').notEmpty(),
//     validateInputs,
//     async function (req, res, next) {
//         let _id = new ObjectId(req.params._id);
//         // check exists
//         propertiesCollection.findOne({_id: _id}).then(async findResult => {
//             if (findResult) {
//
//                 // create code for values
//                 for (let value of req.body.values) {
//                     if (!value.code)
//                         value.code = await getNextSequence('properties-values', true)
//                 }
//
//                 // update
//                 propertiesCollection.updateOne(
//                     {_id: _id},
//                     {
//                         $set: {
//                             title  : req.body.title,
//                             titleEn: req.body.titleEn,
//                             variant: req.body.variant,
//                             values : req.body.values
//                         }
//                     }
//                 ).then((result) => {
//                     return res.sendStatus(result.acknowledged ? 200 : 400);
//                 });
//             } else {
//                 return res.sendStatus(404);
//             }
//         });
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
//         // check exists
//         propertiesCollection.findOne({_id: _id}).then(findResult => {
//             if (findResult) {
//                 // delete
//                 propertiesCollection.deleteOne({_id: _id}).then((result) => {
//                     return res.sendStatus(result.acknowledged ? 200 : 400);
//                 });
//             } else {
//                 return res.sendStatus(404);
//             }
//         });
//     }
// );

module.exports = router;
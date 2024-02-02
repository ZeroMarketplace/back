import Controllers        from "../core/Controllers";
import {validationResult} from "express-validator";

class InputController extends Controllers {
    clearInput($input) {
        return new Promise(async (resolve, reject) => {

            for (const $field of $input) {
                const $index = $input.indexOf($field);

                if ($field.children.length > 0) {
                    // clean every child
                    $input[$index] = await Promise.resolve(this.clearInput($input));
                } else {
                    // check xss
                    $input[$index] = $field.escape();
                }
            }

            return resolve($input);
        });
    }

    checkRequiredFields($input, $requiredFields = []) {
        return new Promise((resolve, reject) => {

            // check all fields
            $requiredFields.forEach(($field) => {
                if (!$input.includes($field)) {
                    // catch
                    return reject({
                        code   : 400,
                        message: "Required fields are empty",
                        fields : $requiredFields
                    });
                }
            });

            // success
            return resolve($input);

        });
    }

    checkValidation(req, res, next) {
        // check validation
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        next();
    }
}
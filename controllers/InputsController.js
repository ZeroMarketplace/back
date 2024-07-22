import Controllers from '../core/Controllers.js';
import validator from 'validator';

class InputsController extends Controllers {
    static clearInput($input) {

        if ($input) {
            // clear every key and index
            for (const [$index, $value] of Object.entries($input)) {
                if (typeof $value === 'object') {
                    // clean every child
                    $input[$index] = this.clearInput($value);
                } else {
                    // check xss
                    if (typeof $input[$index] === 'string')
                        $input[$index] = validator.escape($value);
                }
            }
        }

        return $input;
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
        // // check validation
        // let errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(400).json({errors: errors.array()});
        // }
        // next();
    }
}

export default InputsController;

import Controllers from '../core/Controllers.js';
import validator   from 'validator';

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

    static validateInput($input, $schema) {
        return new Promise((resolve, reject) => {
            const errors = [];

            for (const field in $schema) {
                if ($schema.hasOwnProperty(field)) {
                    const rules = $schema[field];
                    const value = $input[field];

                    // check required
                    if (rules.required && (value === undefined || value === null || value === '')) {
                        errors.push(`${field} is required`);
                        continue;
                    }

                    // check type
                    if (rules.type) {
                        switch (rules.type) {
                            case 'string':
                                if (typeof value !== 'string') {
                                    errors.push(`${field} must be a string`);
                                    continue;
                                }
                                break;
                            case 'mongoId':
                                if (!validator.isMongoId(value)) {
                                    errors.push(`${field} must be an Object Id`);
                                }
                                break;
                            case 'number':
                                if (!validator.isNumeric(value)) {
                                    errors.push(`${field} must be a Number`);
                                }
                                break;
                            case 'strongPassword':
                                if (!validator.isStrongPassword(value)) {
                                    errors.push(`${field} must be a Strong Password`);
                                }
                                break;
                            case 'date':
                                if (!validator.isDate(value)) {
                                    errors.push(`${field} must be a Date`);
                                }
                                break;
                            case 'email':
                                // check is Email
                                if (!validator.isEmail(value)) {
                                    errors.push(`${field} must be a valid email`);
                                }
                                break;
                        }
                    }

                    // check allowed values
                    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
                        errors.push(`${field} must be one of the following values: ${rules.allowedValues.join(', ')}`);
                    }

                    // check minLength
                    if (rules.minLength && !validator.isLength(value, {min: rules.minLength})) {
                        errors.push(`${field} must be at least ${rules.minLength} characters`);
                    }

                    // check maxLength
                    if (rules.maxLength && !validator.isLength(value, {max: rules.maxLength})) {
                        errors.push(`${field} must be at most ${rules.maxLength} characters`);
                    }

                    // check pattern
                    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
                        errors.push(`${field} does not match the pattern ${rules.pattern}`);
                    }
                }
            }

            if (errors.length > 0) {
                return reject({
                    code: 400,
                    data: {
                        message: 'Validation error',
                        errors : errors
                    }
                });
            } else {
                return resolve($input);
            }
        })
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

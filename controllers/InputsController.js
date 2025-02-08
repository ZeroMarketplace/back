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

            const validate = (input, schema, parentPath = '') => {
                for (const field in schema) {
                    if (schema.hasOwnProperty(field)) {
                        const rules     = schema[field];
                        let value       = input[field];
                        const fieldPath = parentPath ? `${parentPath}.${field}` : field;

                        // check required
                        if (rules.required && (value === undefined || value === null || value === '')) {
                            errors.push(`${fieldPath} is required`);
                            continue;
                        }

                        // check if is not required but value is null
                        if (!rules.required && value === undefined) {
                            continue;
                        }

                        // check type
                        if (rules.type) {
                            switch (rules.type) {
                                case 'string':
                                    if (typeof value !== 'string') {
                                        errors.push(`${fieldPath} must be a string`);
                                        continue;
                                    }
                                    break;
                                case 'mongoId':
                                    if (!validator.isMongoId(value)) {
                                        errors.push(`${fieldPath} must be an Object Id`);
                                    }
                                    break;
                                case 'number':
                                    value = Number(value);
                                    if (typeof value !== 'number' || isNaN(value)) {
                                        errors.push(`${fieldPath} must be a Number`);
                                    }
                                    break;
                                case 'strongPassword':
                                    if (!validator.isStrongPassword(value)) {
                                        errors.push(`${fieldPath} must be a Strong Password`);
                                    }
                                    break;
                                case 'date':
                                    let date = new Date(value);
                                    if (!validator.isDate(date)) {
                                        errors.push(`${fieldPath} must be a Date`);
                                    }
                                    break;
                                case 'email':
                                    if (!validator.isEmail(value)) {
                                        errors.push(`${fieldPath} must be a valid email`);
                                    }
                                    break;
                                case 'phone':
                                    const mobileRegex = /^(\+98|0)?9\d{9}$/;
                                    if (!mobileRegex.test(value)) {
                                        errors.push(`${fieldPath} must be a valid phone number`);
                                    }
                                    break;
                                case 'array':
                                    // handle nested objects or arrays
                                    if (Array.isArray(value)) {
                                        // check minLength
                                        if(rules.minItemCount) {
                                            if(value.length < rules.minItemCount) {
                                                errors.push(`${fieldPath} must have at least ${rules.minItemCount} item`);
                                            }
                                        }

                                        // check maxLength
                                        if(rules.maxItemCount) {
                                            if(value.length < rules.maxItemCount) {
                                                errors.push(`${fieldPath} must have at least ${rules.maxItemCount} item`);
                                            }
                                        }

                                        // check items of array
                                        if (rules.items) {
                                            value.forEach((item, index) => {
                                                validate(item, rules.items, `${fieldPath}[${index}]`);
                                            });
                                        }
                                    } else {
                                        errors.push(`${fieldPath} must be a valid array`);
                                    }
                                    break;
                                case 'object':
                                    if (typeof value === 'object') {
                                        if (rules.properties) {
                                            validate(value, rules.properties, fieldPath);
                                        }
                                    } else {
                                        errors.push(`${fieldPath} must be a valid object`);
                                    }
                                    break;
                            }
                        }

                        // check allowed values
                        if (rules.allowedValues && !rules.allowedValues.includes(value)) {
                            errors.push(`${fieldPath} must be one of the following values: ${rules.allowedValues.join(', ')}`);
                        }

                        // check minLength
                        if (rules.minLength && !validator.isLength(value, {min: rules.minLength})) {
                            errors.push(`${fieldPath} must be at least ${rules.minLength} characters`);
                        }

                        // check maxLength
                        if (rules.maxLength && !validator.isLength(value, {max: rules.maxLength})) {
                            errors.push(`${fieldPath} must be at most ${rules.maxLength} characters`);
                        }

                        // check pattern
                        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
                            errors.push(`${fieldPath} does not match the pattern ${rules.pattern}`);
                        }
                    }
                }
            };

            validate($input, $schema);

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
        // // check validation
        // let errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(400).json({errors: errors.array()});
        // }
        // next();
    }
}

export default InputsController;

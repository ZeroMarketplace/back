import Controllers from '../core/Controllers.js';
import validator   from 'validator';
import mongoose    from 'mongoose';

class InputsController extends Controllers {

    constructor() {
        super();
    }

    static clearInput($input) {

        if ($input) {
            // clear every key and index
            for (const [$index, $value] of Object.entries($input)) {
                switch (typeof $value) {
                    case 'object':
                        // clean every child
                        $input[$index] = this.clearInput($value);
                        break;
                    case "string":
                        $input[$index] = validator.escape($value);
                        break;
                }
            }
        }

        return $input;
    }

    static validateInput($input, $schema, $options = {strict: false}) {
        const errors = [];

        const validate = ($inputObject, $schemaOfObject, $parentPath = '', $recursive = false) => {
            // Iterate through each field in the schema
            for (const field in $schemaOfObject) {
                if ($schemaOfObject.hasOwnProperty(field)) {
                    const rules   = $schemaOfObject[field];
                    let value     = $inputObject[field];
                    let fieldPath = $parentPath ? `${$parentPath}.${field}` : field;

                    // fix the exception for array item validation
                    if ($recursive) {
                        fieldPath = $parentPath ? `${$parentPath}` : field;
                    }

                    // Check for required field
                    if (rules.required && (value === undefined || value === null || value === '')) {
                        errors.push(`${fieldPath} is required`);
                        continue;
                    }

                    // Skip undefined if field is not required
                    if (!rules.required && value === undefined) {
                        continue;
                    }

                    // Type validation
                    if (rules.type) {
                        switch (rules.type) {
                            case 'string':
                                if (typeof value !== 'string') {
                                    errors.push(`${fieldPath} must be a string`);
                                    continue;
                                }
                                break;

                            case 'mongoId':
                                if (!mongoose.isValidObjectId(value)) {
                                    errors.push(`${fieldPath} must be a valid ObjectId`);
                                }
                                break;

                            case 'number':
                                if (isNaN(value)) {
                                    errors.push(`${fieldPath} must be a number`);
                                }
                                break;

                            case 'strongPassword':
                                if (!validator.isStrongPassword(value)) {
                                    errors.push(`${fieldPath} must be a strong password`);
                                }
                                break;

                            case 'date':
                                if (!validator.isDate(String(value))) { // Convert to string before validation
                                    errors.push(`${fieldPath} must be a valid date`);
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
                                // Check if the value is an actual array
                                if (!Array.isArray(value)) {
                                    errors.push(`${fieldPath} must be an array`);
                                    break;
                                }

                                // Validate min item count in array
                                if (rules.minItemCount && value.length < rules.minItemCount) {
                                    errors.push(`${fieldPath} must have at least ${rules.minItemCount} items`);
                                }

                                // Validate max item count in array
                                if (rules.maxItemCount && value.length > rules.maxItemCount) {
                                    errors.push(`${fieldPath} must have at most ${rules.maxItemCount} items`);
                                }

                                // Validate each item in the array using the defined "items" schema
                                if (rules.items) {
                                    value.forEach((item, index) => {
                                        validate(
                                            {[field]: item},
                                            {[field]: rules.items},
                                            `${fieldPath}[${index}]`,
                                            true
                                        );
                                    });
                                }
                                break;

                            case 'object':
                                // Ensure value is an object and not null or an array
                                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                                    errors.push(`${fieldPath} must be an object`);
                                    break;
                                }

                                // Validate properties of the object if specified
                                if (rules.properties) {
                                    validate(value, rules.properties, fieldPath);
                                }

                                // Check for extra properties in the object if 'strict' mode is enabled
                                if ($options.strict && Object.keys(value).length !== Object.keys(rules.properties).length) {
                                    errors.push(`${fieldPath} contains extra properties`);
                                }
                                break;
                        }
                    }

                    // Check if value is among allowed values
                    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
                        errors.push(`${fieldPath} must be one of: ${rules.allowedValues.join(', ')}`);
                    }

                    // Validate minLength
                    if (rules.minLength && !validator.isLength(value, {min: rules.minLength})) {
                        errors.push(`${fieldPath} must be at least ${rules.minLength} characters`);
                    }

                    // Validate maxLength
                    if (rules.maxLength && !validator.isLength(value, {max: rules.maxLength})) {
                        errors.push(`${fieldPath} must be at most ${rules.maxLength} characters`);
                    }

                    // Check if value matches the specified pattern
                    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
                        errors.push(`${fieldPath} does not match the pattern ${rules.pattern}`);
                    }
                }
            }
        };

        validate($input, $schema); // Start the validation

        // Return the result of validation or throw errors if found
        if (errors.length > 0) {
            throw {
                code: 400,
                data: {
                    message: 'Validation error',
                    errors : errors
                }
            };
        } else {
            return $input; // Return the validated input if no errors
        }
    }

}

export default InputsController;

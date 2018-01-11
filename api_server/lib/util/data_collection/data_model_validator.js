// provides a validator engine for a generic DataModel, standard validation functions provided here

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class DataModelValidator {

	constructor (attributeDefinitions = {}) {
		this.attributeDefinitions = attributeDefinitions;
		this.setRequiredAttributes();
		this.setValidationFunctions();
	}

	// according to the attribute definitions provided, determine which attributes are required
	setRequiredAttributes () {
		// this just gives us an easy way to look up when an attribute is required
		this.requiredAttributes = [];
		let attributeDefinitions = Object.keys(this.attributeDefinitions);
		attributeDefinitions.forEach(attribute => {
			if (this.attributeDefinitions[attribute].required) {
				this.requiredAttributes.push(attribute);
			}
		});
	}

	// establish the set of known validation functions for different attribute types
	setValidationFunctions () {
		this.validationFunctions = {
			timestamp: this.validateTimestamp.bind(this),
			number: this.validateNumber.bind(this),
			boolean: this.validateBoolean.bind(this),
			string: this.validateString.bind(this),
			object: this.validateObject.bind(this),
			array: this.validateArray.bind(this)
		};
	}

	// validate a set of attributes
	validate (attributes = {}, callback = null, options = {}) {
		this.attributes = attributes;
		this.options = options;
		BoundAsync.series(this, [
			this.checkRequired,
			this.validateAttributes
		], () => {
			let errors = this.errors && this.errors.length ? this.errors : null;
			return callback && callback(errors, this.warnings);
		});
	}

	// check that we have all the required attributes
	checkRequired (callback) {
		if (!this.options.new) {
			// we only require attributes for models being created, since for models that have already existed
			// we can't assume we have their complete set of attributes
			return process.nextTick(callback);
		}
		let missingAttributes = [];
		this.requiredAttributes.forEach(requiredAttribute => {
			if (typeof this.attributes[requiredAttribute] === 'undefined') {
				missingAttributes.push(requiredAttribute);
			}
		});
		if (missingAttributes.length) {
			this.errors = ['these required attributes are missing: ' + missingAttributes.join(',')];
		}
		process.nextTick(callback);
	}

	// validate each individual attribute according to its own validation rule
	validateAttributes (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.attributes),
			10,
			this.validateAttribute,
			callback
		);
	}

	// validate an individual attribute according to its own validation rule
	validateAttribute (attribute, callback) {
		const attributeDefinition = this.attributeDefinitions[attribute];
		if (!attributeDefinition) {
			// we delete (with a warning) any attributes we don't recognize,
			// unless the definitions are defined as "free-form"
			if (!this.attributeDefinitions.$freeFormOk) {
				this.warnings = this.warnings || [];
				this.warnings.push(`Deleting attribute ${attribute}, attribute not found in attribute definitions`);
				delete this.attributes[attribute];
			}
			return process.nextTick(callback);
		}

		// lookup the attribute type, we must have a validation function for this attribute type or we'll delete
		// the attribute with a warning
		const type = attributeDefinition.type;
		let validationFunction = this.validationFunctions[type];
		if (typeof validationFunction !== 'function') {
			this.warnings = this.warnings || [];
			this.warnings.push(`Deleting attribute ${attribute}, type ${type} is not recognized`);
			delete this.attributes[attribute];
			return process.nextTick(callback);
		}

		// now run the actual validation function, if the attribute exists
		if (typeof this.attributes[attribute] !== 'undefined') {
			let validationResult = validationFunction(this.attributes[attribute], attributeDefinition);
			if (validationResult) {
				this.errors = this.errors || [];
				this.errors.push({ [attribute]: validationResult });
			}
		}

		process.nextTick(callback);
	}

	// validate a timestamp value, must be a number
	validateTimestamp (value/*, definition*/) {
		if (typeof value !== 'number') {
			return 'timestamp must be a number';
		}
	}

	// validate a numeric value
	validateNumber (value/*, definition*/) {
		if (typeof value !== 'number') {
			return 'must be a number';
		}
	}

	// validate a boolean value
	validateBoolean (value/*, definition*/) {
		if (value !== true && value !== false) {
			return 'must be a boolean';
		}
	}

	// validate a string value, which can be restricted in length
	validateString (value, definition) {
		if (typeof value !== 'string') {
			return 'must be a string';
		}
		if (
			definition &&
			definition.maxLength &&
			value.length > definition.maxLength
		) {
			return `string length must be less than or equal to ${definition.maxLength} characters`;
		}
		if (
			definition &&
			definition.minLength &&
			value.length < definition.minLength
		) {
			return `string length must be greater than or equal to ${definition.minLength} characters`;
		}
	}

	// validate a value that can be an object, and can be limited in size (according to JSON.stringify())
	validateObject (value, definition) {
		if (typeof value !== 'object') {
			return 'must be an object';
		}
		if (
			definition &&
			definition.maxSize &&
			JSON.stringify(value).length > definition.maxSize
		) {
			return 'object is too big';
		}
	}

	// validate an array value, which can be limited in length or in overall size (according to JSON.stringify())
	validateArray (value, definition) {
		if (!(value instanceof Array)) {
			return 'must be an array';
		}
		if (
			definition &&
			definition.maxLength &&
			value.length > definition.maxLength
		) {
			return 'too many elements in array';
		}
		if (
			definition &&
			definition.maxSize &&
			JSON.stringify(value).length > definition.maxSize
		) {
			return 'array is too big';
		}
	}

	// for a given object, sanitize (delete) any attributes that should not get served to clients
	sanitizeAttributes (object) {
		Object.keys(this.attributeDefinitions).forEach(attribute => {
			if (this.attributeDefinitions[attribute].serverOnly) {
				delete object[attribute];
			}
		});
		return object;
	}

	// for a given model, sanitize (delete) any attributes that should not get served to clients
	// (convenience wrapper for sanitizeAttributes)
	sanitizeModel (model) {
		this.sanitizeAttributes(model.attributes);
		return model;
	}

	// for a given model, return a sanitized object with any attributes removed that should not be served to clients
	getSanitizedObject (model) {
		let object = DeepClone(model.attributes);
		return this.sanitizeAttributes(object);
	}
}

module.exports = DataModelValidator;

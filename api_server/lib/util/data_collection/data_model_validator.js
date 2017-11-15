'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DeepClone = require(process.env.CS_API_TOP + '/lib/util/deep_clone');

class DataModelValidator {

	constructor (attributeDefinitions = {}) {
		this.attributeDefinitions = attributeDefinitions;
		this.setRequiredAttributes();
		this.setValidationFunctions();
	}

	setRequiredAttributes () {
		this.requiredAttributes = [];
		let attributeDefinitions = Object.keys(this.attributeDefinitions);
		attributeDefinitions.forEach(attribute => {
			if (this.attributeDefinitions[attribute].required) {
				this.requiredAttributes.push(attribute);
			}
		});
	}

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

	validate (attributes = {}, callback = null, options = {}) {
		this.attributes = attributes;
		this.options = options;
		this.existingAttributes = Object.keys(this.attributes);
		BoundAsync.series(this, [
			this.checkRequired,
			this.validateAttributes
		], () => {
			let errors = this.errors && this.errors.length ? this.errors : null;
			return callback && callback(errors, this.warnings);
		});
	}

	checkRequired (callback) {
		if (!this.options.new) {
			return process.nextTick(callback);
		}
		let missingAttributes = [];
		this.requiredAttributes.forEach(requiredAttribute => {
			if (this.existingAttributes.indexOf(requiredAttribute) === -1) {
				missingAttributes.push(requiredAttribute);
			}
		});
		if (missingAttributes.length) {
			this.errors = ['these required attributes are missing: ' + missingAttributes.join(',')];
		}
		process.nextTick(callback);
	}

	validateAttributes (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.attributes),
			10,
			this.validateAttribute,
			callback
		);
	}

	validateAttribute (attribute, callback) {
		const attributeDefinition = this.attributeDefinitions[attribute];
		if (!attributeDefinition) {
			if (!this.attributeDefinitions.$freeFormOk) {
				this.warnings = this.warnings || [];
				this.warnings.push(`Deleting attribute ${attribute}, attribute not found in attribute definitions`);
				delete this.attributes[attribute];
			}
			return process.nextTick(callback);
		}

		const type = attributeDefinition.type;
		let validationFunction = this.validationFunctions[type];
		if (typeof validationFunction !== 'function') {
			this.warnings = this.warnings || [];
			this.warnings.push(`Deleting attribute ${attribute}, type ${type} is not recognized`);
			delete this.attributes[attribute];
			return process.nextTick(callback);
		}

		if (typeof this.attributes[attribute] !== 'undefined') {
			let validationResult = validationFunction(this.attributes[attribute], attributeDefinition);
			if (validationResult) {
				this.errors = this.errors || [];
				this.errors.push({ [attribute]: validationResult });
			}
		}

		process.nextTick(callback);
	}

	validateTimestamp (value/*, definition*/) {
		if (typeof value !== 'number') {
			return 'timestamp must be a number';
		}
	}

	validateNumber (value/*, definition*/) {
		if (typeof value !== 'number') {
			return 'must be a number';
		}
	}

	validateBoolean (value/*, definition*/) {
		if (value !== true && value !== false) {
			return 'must be a boolean';
		}
	}

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

	sanitizeAttributes (object) {
		Object.keys(this.attributeDefinitions).forEach(attribute => {
			if (this.attributeDefinitions[attribute].serverOnly) {
				delete object[attribute];
			}
		});
		return object;
	}

	sanitizeModel (model) {
		this.sanitizeAttributes(model.attributes);
		return model;
	}

	getSanitizedObject (model) {
		let object = DeepClone(model.attributes);
		return this.sanitizeAttributes(object);
	}
}

module.exports = DataModelValidator;

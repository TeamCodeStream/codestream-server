'use strict';

var DataModelValidator = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model_validator');
var URL = require('url');
var ObjectID = require('mongodb').ObjectID;
const CodeStreamModelAttributes = require('./codestream_model_attributes');

class CodeStreamModelValidator extends DataModelValidator {

	constructor (attributeDefinitions) {
		let totalAttributeDefinitions = Object.assign({}, CodeStreamModelAttributes, attributeDefinitions);
		super(totalAttributeDefinitions);
	}

	setValidationFunctions () {
		super.setValidationFunctions();
		Object.assign(this.validationFunctions, {
			id: this.validateId.bind(this),
			arrayOfIds: this.validateArrayOfIds.bind(this),
			arrayOfStrings: this.validateArrayOfStrings.bind(this),
			arrayOfObjects: this.validateArrayOfObjects.bind(this),
			url: this.validateUrl.bind(this)
		});
	}

	validateId (value/*, definition, options*/) {
		try {
			ObjectID(value);
		}
		catch(error) {
			return `invalid ID: ${error}`;
		}
	}

	validateArrayOfIds (value, definition, options) {
		if (!(value instanceof Array)) {
			return 'must be an array of IDs';
		}
		if (
			definition &&
			definition.maxLength &&
			value.length > definition.maxLength
		) {
			return 'array is too long';
		}
		for (let index = 0, length = value.length; index < length; index++) {
			let result = this.validateId(value[index], definition, options);
			if (result) {
				return `element ${index} is not a valid ID: ${result}`;
			}
		}
	}

	validateArrayOfStrings (value, definition/*, options*/) {
		if (!(value instanceof Array)) {
			return 'must be an array of strings';
		}
		if (
			definition &&
			definition.maxLength &&
			value.length > definition.maxLength
		) {
			return 'array is too long';
		}
		for (let index = 0, length = value.length; index < length; index++) {
			if (typeof value[index] !== 'string') {
				return `element at ${index} is not a string`;
			}
			else if (
				definition &&
				definition.maxStringLength &&
				value[index].length > definition.maxStringLength
			) {
				return `element at ${index} is too long`;
			}
		}
	}

	validateArrayOfObjects (value, definition/*, options*/) {
		if (!(value instanceof Array)) {
			return 'must be an array of objects';
		}
		if (
			definition &&
			definition.maxLength &&
			value.length > definition.maxLength
		) {
			return 'array is too long';
		}
		for (let index = 0, length = value.length; index < length; index++) {
			if (typeof value[index] !== 'object') {
				return `element at ${index} is not an object`;
			}
			else if (
				definition &&
				definition.maxObjectLength &&
				JSON.stringify(value[index]).length > definition.maxObjectLength
			) {
				return `object at ${index} is too long`;
			}
		}
	}

	validateUrl (value, definition/*, options*/) {
		if (!value || typeof value !== 'string') {
			return 'not a string';
		}
		if (
			definition &&
			definition.maxLength &&
			value.length > definition.maxLength
		) {
			return 'url is too long';
		}
		let parsed = URL.parse(value);
		if (!parsed.host || !parsed.pathname) {
			return 'invalid url';
		}
	}
}

module.exports = CodeStreamModelValidator;

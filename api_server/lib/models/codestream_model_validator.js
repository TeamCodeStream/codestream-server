'use strict';

var Data_Model_Validator = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model_validator');
var URL = require('url');
var ObjectID = require('mongodb').ObjectID;
const CodeStream_Model_Attributes = require('./codestream_model_attributes');

class CodeStream_Model_Validator extends Data_Model_Validator {

	constructor (attribute_definitions) {
		let total_attribute_definitions = Object.assign({}, CodeStream_Model_Attributes, attribute_definitions);
		super(total_attribute_definitions);
	}

	set_validation_functions () {
		super.set_validation_functions();
		Object.assign(this.validation_functions, {
			id: this.validate_id.bind(this),
			array_of_ids: this.validate_array_of_ids.bind(this),
			url: this.validate_url.bind(this)
		});
	}

	validate_id (value/*, definition, options*/) {
		try {
			ObjectID(value);
		}
		catch(error) {
			return `invalid ID: ${error}`;
		}
	}

	validate_array_of_ids (value, definition, options) {
		if (!(value instanceof Array)) {
			return 'must be an array of IDs';
		}
		if (
			definition &&
			definition.max_length &&
			value.length > definition.max_length
		) {
			return 'array is too long';
		}
		for (let index = 0, length = value.length; index < length; index++) {
			let result = this.validate_id(value[index], definition, options);
			if (result) {
				return `element ${index} is not a valid ID: ${result}`;
			}
		}
	}

	validate_url (value, definition/*, options*/) {
		if (!value || typeof value !== 'string') {
			return 'not a string';
		}
		if (
			definition &&
			definition.max_length &&
			value.length > definition.max_length
		) {
			return 'url is too long';
		}
		let parsed = URL.parse(value);
		if (!parsed.host || !parsed.pathname) {
			return 'invalid url';
		}
	}
}

module.exports = CodeStream_Model_Validator;

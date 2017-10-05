'use strict';

var Data_Model_Validator = require(process.env.CI_API_TOP + '/lib/util/data_collection/data_model_validator');
var CodeStream_Model_Attributes = require('./codestream_model_attributes');
var URL = require('url');

class CodeStream_Model_Validator extends Data_Model_Validator {

	constructor (attribute_definitions) {
		var total_attribute_definitions = Object.assign({}, CodeStream_Model_Attributes, attribute_definitions);
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

	validate_id (/*value, definition, options*/) {
		// TODO -- any way to validate mongo ID?
	}

	validate_array_of_ids (value, definition, options) {
		if (!(value instanceof Array)) {
			return 'must be an array of IDs';
		}
		for (let index = 0, length = value.length; index < length; index++) {
			var result = this.validate_id(value[index], definition, options);
			if (result) {
				return `element ${index} is not a valid ID: ${result}`;
			}
		}
	}

	validate_url (value, definition/*, options*/) {
		const message = 'invalid url';
		if (!value || typeof value !== 'string') {
			return message;
		}
		if (definition.max_length && value.length > definition.max_length) {
			return 'url is too long';
		}
		var parsed = URL.parse(value);
		if (!parsed.host || !parsed.pathname) {
			return message;
		}
	}
}

module.exports = CodeStream_Model_Validator;

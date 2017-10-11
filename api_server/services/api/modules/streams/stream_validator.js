'use strict';

var CodeStream_Model_Validator = require(process.env.CI_API_TOP + '/lib/models/codestream_model_validator');
const Stream_Attributes = require('./stream_attributes');
const STREAM_TYPES = require('./stream_types');

class Stream_Validator extends CodeStream_Model_Validator {

	constructor (attribute_definitions) {
		let total_attribute_definitions = Object.assign({}, Stream_Attributes, attribute_definitions);
		super(total_attribute_definitions);
	}

	set_validation_functions () {
		super.set_validation_functions();
		Object.assign(this.validation_functions, {
			stream_type: this.validate_stream_type.bind(this)
		});
	}

	validate_stream_type (value/*, definition, options*/) {
		if (STREAM_TYPES.indexOf(value) === -1) {
			return `invalid stream type: ${value}`;
		}
	}
}

module.exports = Stream_Validator;

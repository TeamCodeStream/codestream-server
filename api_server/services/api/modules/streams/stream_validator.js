'use strict';

var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const StreamAttributes = require('./stream_attributes');
const StreamTypes = require('./stream_types');

class StreamValidator extends CodeStreamModelValidator {

	constructor (attributeDefinitions) {
		let totalAttributeDefinitions = Object.assign({}, StreamAttributes, attributeDefinitions);
		super(totalAttributeDefinitions);
	}

	setValidationFunctions () {
		super.setValidationFunctions();
		Object.assign(this.validationFunctions, {
			streamType: this.validateStreamType.bind(this)
		});
	}

	validateStreamType (value/*, definition, options*/) {
		if (StreamTypes.indexOf(value.toLowerCase()) === -1) {
			return `invalid stream type: ${value}`;
		}
	}
}

module.exports = StreamValidator;

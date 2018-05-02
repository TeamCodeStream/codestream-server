// provide a validator for stream attributes

'use strict';

const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const StreamAttributes = require('./stream_attributes');
const StreamTypes = require('./stream_types');
const PrivacyTypes = require('./privacy_types');

class StreamValidator extends CodeStreamModelValidator {

	constructor (attributeDefinitions) {
		let totalAttributeDefinitions = Object.assign({}, StreamAttributes, attributeDefinitions);
		super(totalAttributeDefinitions);
	}

	setValidationFunctions () {
		super.setValidationFunctions();
		Object.assign(this.validationFunctions, {
			streamType: this.validateStreamType.bind(this),
			privacyType: this.validatePrivacyType.bind(this)
		});
	}

	// validate that the stream type is one of the accepted types
	validateStreamType (value/*, definition, options*/) {
		if (!StreamTypes.includes(value.toLowerCase())) {
			return `invalid stream type: ${value}`;
		}
	}

	// validate that the privacy setting is one of the accepted types
	validatePrivacyType (value/*, definition, options*/) {
		if (!PrivacyTypes.includes(value.toLowerCase())) {
			return `invalid privacy type: ${value}`;
		}
	}
}

module.exports = StreamValidator;

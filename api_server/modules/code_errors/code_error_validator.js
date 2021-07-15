// provide a validator for code error attributes

'use strict';

const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');
const CodeErrorAttributes = require('./code_error_attributes');

class CodeErrorValidator extends CodeStreamModelValidator {

	constructor (attributeDefinitions) {
		let totalAttributeDefinitions = Object.assign({}, CodeErrorAttributes, attributeDefinitions);
		super(totalAttributeDefinitions);
	}
}

module.exports = CodeErrorValidator;

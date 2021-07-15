// provides the CodeError model for handling code errors

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model');
const CodeErrorAttributes = require('./code_error_attributes');
const CodeErrorValidator = require('./code_error_validator');

class CodeError extends CodeStreamModel {

	getValidator () {
		return new CodeErrorValidator(CodeErrorAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all native IDs are lowercase
		this.lowerCase('teamId');
		this.lowerCaseNativeId('streamId');
		this.lowerCaseNativeId('postId');
		this.lowerCase('codemarkIds');
		await super.preSave(options);
	}
}

module.exports = CodeError;

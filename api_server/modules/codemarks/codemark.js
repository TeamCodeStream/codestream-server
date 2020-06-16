// provides the Codemark model for handling codemarks

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model');
const CodemarkAttributes = require('./codemark_attributes');
const CodemarkValidator = require('./codemark_validator');

class Codemark extends CodeStreamModel {

	getValidator () {
		return new CodemarkValidator(CodemarkAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all native IDs are lowercase
		this.lowerCase('teamId');
		this.lowerCaseNativeId('streamId');
		this.lowerCaseNativeId('postId');
		this.lowerCase('markerIds');
		await super.preSave(options);
	}
}

module.exports = Codemark;

// provides the CodeMark model for handling codemarks

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const CodeMarkAttributes = require('./codemark_attributes');

class CodeMark extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(CodeMarkAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all native IDs are lowercase
		this.lowerCase('teamId');
		if (!this.attributes.providerType) {
			this.lowerCase('streamId');
			this.lowerCase('postId');
		}
		this.lowerCase('markerIds');
		await super.preSave(options);
	}
}

module.exports = CodeMark;

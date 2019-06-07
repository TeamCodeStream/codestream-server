// provides the ProviderPost model for handling provider posts

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const ProviderPostAttributes = require('./provider_post_attributes');

class ProviderPost extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(ProviderPostAttributes);
	}

	// right before the post is saved...
	async preSave (options) {
		this.lowerCase('teamId');
		await super.preSave(options);
	}
}

module.exports = ProviderPost;

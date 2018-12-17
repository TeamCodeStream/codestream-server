// provides the SlackPost model for handling slack posts

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const SlackPostAttributes = require('./slack_post_attributes');

class SlackPost extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(SlackPostAttributes);
	}

	// right before the post is saved...
	async preSave (options) {
		this.lowerCase('teamId');
		await super.preSave(options);
	}
}

module.exports = SlackPost;

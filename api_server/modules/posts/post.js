'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const PostAttributes = require('./post_attributes');
const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');

class Post extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(PostAttributes);
	}

	preSave (callback, options) {
		this.lowerCase('teamId');
		this.lowerCase('repoId');
		this.lowerCase('streamId');
		this.lowerCase('parentPostId');
		this.lowerCase('commitHashWhenPosted');
		this.lowerCase('markerIds');
		super.preSave(callback, options);
	}

	// does this post mention the current user?
	mentionsUser (user) {
		if (!this.get('text')) {
			return false;
		}
		let username = user.get('username') ||
			EmailUtilities.parseEmail(user.get('email')).name;
		// look for @username
		let regexp = new RegExp(`@${username}`);
		return !!this.get('text').match(regexp);
	}
}

module.exports = Post;

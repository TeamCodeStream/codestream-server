// provides the Post model for handling posts

'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const PostAttributes = require('./post_attributes');

class Post extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(PostAttributes);
	}

	// right before the post is saved...
	preSave (callback, options) {
		// ensure referencing IDs are lower-cased
		this.lowerCase('teamId');
		this.lowerCase('repoId');
		this.lowerCase('streamId');
		this.lowerCase('parentPostId');
		this.lowerCase('commitHashWhenPosted');
		this.lowerCase('markerIds');
		// ensure mentionedUserIds array is sorted
		if (this.attributes.mentionedUserIds instanceof Array) {
			this.attributes.mentionedUserIds.sort();
		}
		super.preSave(callback, options);
	}

	// does this post mention the current user?
	mentionsUser (user) {
		let mentionedUserIds = this.get('mentionedUserIds') || [];
		return mentionedUserIds.includes(user.id);
	}
}

module.exports = Post;

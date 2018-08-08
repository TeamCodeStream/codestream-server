// provides the Post model for handling posts

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const PostAttributes = require('./post_attributes');

class Post extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(PostAttributes);
	}

	// right before the post is saved...
	async preSave (options) {
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
		await super.preSave(options);
	}

	// does this post mention the current user?
	mentionsUser (user) {
		const mentionedUserIds = this.get('mentionedUserIds') || [];
		return mentionedUserIds.includes(user.id);
	}

	// get the emote for this post, if it starts with /me (basically the rest of the post)
	getEmote () {
		const text = this.get('text') || '';
		const match = text.match(/^\/me\s+(.*)/);
		return match && match.length > 1 && match[1];
	}
}

module.exports = Post;

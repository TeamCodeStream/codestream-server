'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const PostAttributes = require('./post_attributes');

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
}

module.exports = Post;

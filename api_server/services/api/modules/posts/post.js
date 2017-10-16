'use strict';

var CodeStream_Model = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStream_Model_Validator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const Post_Attributes = require('./post_attributes');

class Post extends CodeStream_Model {

	get_validator () {
		return new CodeStream_Model_Validator(Post_Attributes);
	}
}

module.exports = Post;

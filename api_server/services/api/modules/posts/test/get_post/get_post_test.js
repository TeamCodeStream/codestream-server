'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var Post_Test_Constants = require('../post_test_constants');

const DESCRIPTION = 'should return a valid post when requesting a post';

class Get_Post_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	get_expected_fields () {
		return { post: Post_Test_Constants.EXPECTED_POST_FIELDS };
	}

	before (callback) {
		this.post_factory.create_random_post(
			(error, post) => {
				if (error) { return callback(error); }
				this.created_post = post;
				this.path = '/post/' + post._id;
				callback();
			},
			{
				org: this.current_orgs[0],
				token: this.token
			}
		);
	}

	validate_response (data) {
		return this.validate_matching_object(this.created_post._id, data.post, 'post');
	}
}

module.exports = Get_Post_Test;

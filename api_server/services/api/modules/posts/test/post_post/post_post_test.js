'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var Post_Test_Constants = require('../post_test_constants');

class Post_Post_Test extends CodeStream_API_Test {

	get_description () {
		return `should return a valid post when creating a ${this.type} post`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/post';
	}

	get_expected_fields () {
		var position_fields = Post_Test_Constants.WANT_POSITION[this.type] ? Post_Test_Constants.EXPECTED_POST_POSITION_FIELDS : [];
		return {
			post: [
				...Post_Test_Constants.EXPECTED_POST_FIELDS,
				...Post_Test_Constants.EXPECTED_POST_FIELDS_BY_TYPE[this.type],
				...position_fields
			]
		};
	}

	before (callback) {
		this.post_factory.get_random_post_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			{
				type: this.type,
				org: this.current_orgs[0],
				token: this.token
			}
		);
	}

	validate_response (data) {
		var post = data.post;
		var errors = [];
		var result = (
			((post.creator_id === this.current_user._id) || errors.push('group creator is not the current user')) &&
			((post.org_id === this.current_orgs[0]._id) || errors.push('org_id is not equal to current user\'s org id')) &&
			((typeof post.text === 'string') || errors.push('text is not a string'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
	}

	validate_position (data) {
		var post = data.post;
		var errors = [];
		var result = (
			((typeof post.char_start === 'number') || errors.push('char_start is not a number')) &&
			((typeof post.char_end === 'number') || errors.push('char_end is not a number')) &&
			((typeof post.line_start === 'number') || errors.push('line_start is not a number')) &&
			((typeof post.line_end === 'number') || errors.push('line_end is not a number'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
	}
}

module.exports = Post_Post_Test;

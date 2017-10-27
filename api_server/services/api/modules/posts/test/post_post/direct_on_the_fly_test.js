'use strict';

var Post_To_Direct_Test = require('./post_to_direct_test');
var Assert = require('assert');
const Post_Test_Constants = require('../post_test_constants');

class Direct_On_The_Fly_Test extends Post_To_Direct_Test {

	get description () {
		return 'should return a valid post and stream when creating a post and creating a direct stream on the fly';
	}

	create_random_stream (callback) {
		// do nothing
		return callback();
	}

	make_post_options (callback) {
		this.stream_factory.get_random_stream_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.post_options = { stream: data };
				callback();
			},
			this.stream_options
		);
	}

	validate_response (data) {
		Assert(typeof data.stream === 'object', 'no stream returned');
		Assert(data.post.stream_id === data.stream._id, 'the post\'s stream_id does not match the id of the returned stream');
		this.validate_stream(data);
		this.data.stream_id = data.stream._id;
		super.validate_response(data);
	}

	validate_stream (data) {
		let stream = data.stream;
		let errors = [];
		if (stream.type !== 'file') {
			stream.member_ids.sort();
			if (this.data.stream.member_ids.indexOf(this.current_user._id) === -1) {
				this.data.stream.member_ids.push(this.current_user._id);
			}
			this.data.stream.member_ids.sort();
			Assert.deepEqual(this.data.stream.member_ids, stream.member_ids, 'member_ids does not match');
		}
		let result = (
			((stream.type === this.data.stream.type) || errors.push('type does not match')) &&
			((stream.team_id === this.data.stream.team_id) || errors.push('team_id does not match')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.created_at === 'number') || errors.push('created_at not number')) &&
			((stream.modified_at >= stream.created_at) || errors.push('modified_at not greater than or equal to created_at')) &&
			((stream.creator_id === this.current_user._id) || errors.push('creator_id not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'stream response not valid: ' + errors.join(', '));
		this.validate_sanitized(stream, Post_Test_Constants.UNSANITIZED_STREAM_ATTRIBUTES);
	}

}

module.exports = Direct_On_The_Fly_Test;

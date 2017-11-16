'use strict';

var PostToDirectTest = require('./post_to_direct_test');
var Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class DirectOnTheFlyTest extends PostToDirectTest {

	get description () {
		return 'should return a valid post and stream when creating a post and creating a direct stream on the fly';
	}

	createRandomStream (callback) {
		// do nothing
		return callback();
	}

	makePostOptions (callback) {
		this.streamFactory.getRandomStreamData(
			(error, data) => {
				if (error) { return callback(error); }
				this.postOptions = { stream: data };
				callback();
			},
			this.streamOptions
		);
	}

	validateResponse (data) {
		Assert(typeof data.stream === 'object', 'no stream returned');
		Assert(data.post.streamId === data.stream._id, 'the post\'s streamId does not match the id of the returned stream');
		this.validateStream(data);
		this.data.streamId = data.stream._id;
		super.validateResponse(data);
	}

	validateStream (data) {
		let stream = data.stream;
		let errors = [];
		if (stream.type !== 'file') {
			stream.memberIds.sort();
			if (this.data.stream.memberIds.indexOf(this.currentUser._id) === -1) {
				this.data.stream.memberIds.push(this.currentUser._id);
			}
			this.data.stream.memberIds.sort();
			Assert.deepEqual(this.data.stream.memberIds, stream.memberIds, 'memberIds does not match');
		}
		let result = (
			((stream.type === this.data.stream.type) || errors.push('type does not match')) &&
			((stream.teamId === this.data.stream.teamId) || errors.push('teamId does not match')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.createdAt === 'number') || errors.push('createdAt not number')) &&
			((stream.modifiedAt >= stream.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((stream.creatorId === this.currentUser._id) || errors.push('creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'stream response not valid: ' + errors.join(', '));
		this.validateSanitized(stream, PostTestConstants.UNSANITIZED_STREAM_ATTRIBUTES);
	}

}

module.exports = DirectOnTheFlyTest;

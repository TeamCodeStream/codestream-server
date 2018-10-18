'use strict';

const PostToDirectTest = require('./post_to_direct_test');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class DirectOnTheFlyTest extends PostToDirectTest {

	get description () {
		return 'should return a valid post and stream when creating a post and creating a direct stream on the fly';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			if (this.streamType === 'file') {
				this.repoOptions.creatorIndex = 0;
			}
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			// get some data for a random stream and add that to the post options,
			// this is an attempt to create a stream "on-the-fly"
			this.streamFactory.getRandomStreamData(
				(error, data) => {
					if (error) { return callback(error); }
					delete this.data.streamId;
					this.data.stream = data;
					callback();
				},
				{
					teamId: this.team._id,
					type: this.streamType || 'direct',
					file: this.duplicateStream ? this.duplicateStream.file : undefined, 
					memberIds: [this.users[1].user._id],
					repoId: this.streamType === 'file' ? this.repo._id : undefined,
					name: this.duplicateStream ? this.duplicateStream.name : undefined
				}
			);
		});
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that we got back a stream object, and that it matches the
		// options we went for the stream
		Assert(typeof data.streams[0] === 'object', 'no stream returned');
		Assert(data.post.streamId === data.streams[0]._id, 'the post\'s streamId does not match the id of the returned stream');
		this.validateStream(data);
		this.data.streamId = data.streams[0]._id;
		this.noStreamUpdate = true;
		super.validateResponse(data);
	}

	// validate the stream object we received to the request response
	validateStream (data) {
		const stream = data.streams[0];
		const errors = [];
		if (stream.type !== 'file') {
			// only direct or channel streams have members, sort both arrays of
			// member IDs for a valid deepEqual comparison
			stream.memberIds.sort();
			if (!this.data.stream.memberIds.includes(this.currentUser.user._id)) {
				this.data.stream.memberIds.push(this.currentUser.user._id);
			}
			this.data.stream.memberIds.sort();
			Assert.deepEqual(this.data.stream.memberIds, stream.memberIds, 'memberIds does not match');
		}
		const result = (
			((stream.type === this.data.stream.type) || errors.push('type does not match')) &&
			((stream.teamId === this.data.stream.teamId) || errors.push('teamId does not match')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.createdAt === 'number') || errors.push('createdAt not number')) &&
			((stream.modifiedAt >= stream.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((stream.creatorId === this.currentUser.user._id) || errors.push('creatorId not equal to current user id'))
		);
		Assert(result === true && errors.length === 0, 'stream response not valid: ' + errors.join(', '));
		this.validateSanitized(stream, PostTestConstants.UNSANITIZED_STREAM_ATTRIBUTES);
	}

}

module.exports = DirectOnTheFlyTest;

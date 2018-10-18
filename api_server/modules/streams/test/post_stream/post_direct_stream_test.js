'use strict';

const Assert = require('assert');
const PostStreamTest = require('./post_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class PostDirectStreamTest extends PostStreamTest {

	constructor (options) {
		super(options);
		this.type = 'direct';
	}

	getExpectedFields () {
		// expect standard stream fields, plus stream fields for a direct
		const fields = Object.assign({}, super.getExpectedFields());
		fields.stream = [
			...fields.stream,
			...StreamTestConstants.EXPECTED_DIRECT_STREAM_FIELDS
		];
		return fields;
	}

	// make options to use when creating the stream for the test
	makeStreamOptions (callback) {
		// get the standard stream options, and add some members to the stream
		super.makeStreamOptions(() => {
			this.postStreamOptions.memberIds = this.users.splice(1, 3).map(user => user.user._id);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// the current user will be automatically added as a member, make sure we have a sorted
		// array so we can compare arrays
		if (!this.data.memberIds.includes(this.currentUser.user._id)) {
			this.data.memberIds.push(this.currentUser.user._id);
			this.data.memberIds.sort();
		}
		const stream = data.stream;
		const errors = [];
		const result = (
			((JSON.stringify(stream.memberIds) === JSON.stringify(this.data.memberIds)) || errors.push('memberIds array does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		super.validateResponse(data);
	}
}

module.exports = PostDirectStreamTest;

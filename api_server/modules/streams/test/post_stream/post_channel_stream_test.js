'use strict';

var Assert = require('assert');
var PostStreamTest = require('./post_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class PostChannelStreamTest extends PostStreamTest {

	constructor (options) {
		super(options);
		this.type = 'channel';
	}

	getExpectedFields () {
		// expect standard stream fields, plus stream fields for a channel
		let fields = Object.assign({}, super.getExpectedFields());
		fields.stream = [
			...fields.stream,
			...StreamTestConstants.EXPECTED_CHANNEL_STREAM_FIELDS
		];
		return fields;
	}

	// make options to use when creating the stream for the test
	makeStreamOptions (callback) {
		// get the standard stream options, and add some members to the stream
		super.makeStreamOptions(() => {
			this.streamOptions.memberIds = this.users.splice(1, 3).map(user => user._id);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// the current user will be automatically added as a member, make sure we have a sorted
		// array so we can compare arrays
		if (!this.data.isTeamStream) {
			if (!this.data.memberIds.includes(this.currentUser._id)) {
				this.data.memberIds.push(this.currentUser._id);
				this.data.memberIds.sort();
			}
		}
		let stream = data.stream;
		let errors = [];
		let result = (
			((stream.name === this.data.name) || errors.push('name does not match')) &&
			(this.data.isTeamStream ||
				((JSON.stringify(stream.memberIds) === JSON.stringify(this.data.memberIds)) || errors.push('memberIds array does not match'))
			)
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		super.validateResponse(data);
	}
}

module.exports = PostChannelStreamTest;

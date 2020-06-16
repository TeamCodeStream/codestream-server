'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class LastReadsNoneTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		Object.assign(this.streamOptions, {
			type: this.type || 'channel',
			creatorIndex: 1
		});
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			numPosts: 3
		});
		if (this.type === 'file') {
			this.repoOptions.creatorIndex = 1;
		}
	}

	get description () {
		return `last read attribute for members of the stream should get updated to "0" when a new post is created in a ${this.type} stream and those members have not read any posts in the stream yet`;
	}

	get method () {
		return 'get';
	}

	get path () {
		// the test is to check the lastReads attribute for the stream, which we
		// get when we fetch the user's own user object
		return '/users/me';
	}

	getExpectedFields () {
		return { user: ['lastReads'] };
	}

	// validate the response to the request
	validateResponse (data) {
		// we fetched the user's "user" object, we should see their lastReads attribute
		// for the created stream set to 0, meaning they haven't read any messages in that
		// stream
		Assert(data.user.lastReads[this.stream.id] === 0, 'lastReads for stream is not 0');
	}
}

module.exports = LastReadsNoneTest;

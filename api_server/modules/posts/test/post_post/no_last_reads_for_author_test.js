'use strict';

const LastReadsNoneTest = require('./last_reads_none_test');
const Assert = require('assert');

class NoLastReadsForAuthorTest extends LastReadsNoneTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = [1, 1, 0];
	}

	get description () {
		return 'last read attribute for the post author should not be updated when a new post is created in a stream';
	}

	getExpectedFields () {
		return { user: ['id'] };
	}

	// validate the response to the request
	validateResponse (data) {
		// since the current user was the creator of the posts, this should not
		// create any lastReads for the user
		Assert.deepEqual(data.user.lastReads, {}, 'lastReads is not empty');
	}
}

module.exports = NoLastReadsForAuthorTest;

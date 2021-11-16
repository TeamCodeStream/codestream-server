'use strict';

const LastReadsNoneForObjectStreamTest = require('./last_reads_none_for_object_stream_test');
const Assert = require('assert');

class NoLastReadsForAuthorForObjectStreamTest extends LastReadsNoneForObjectStreamTest {

	constructor (options) {
		super(options);
		this.postOptions.postData[3].creatorIndex = 0;
	}

	get description () {
		return 'last read attribute for the post author should not be updated when a new post is created in an object stream';
	}

	getExpectedFields () {
		return { user: ['id'] };
	}

	// validate the response to the request
	validateResponse (data) {
		// since the current user was the creator of the posts, this should not
		// create any lastReads for the user
		Assert.deepStrictEqual(data.user.lastReads, {}, 'lastReads is not empty');
	}
}

module.exports = NoLastReadsForAuthorForObjectStreamTest;

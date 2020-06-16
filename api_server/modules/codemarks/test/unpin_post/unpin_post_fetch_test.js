'use strict';

const UnpinPostTest = require('./unpin_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class UnpinPostFetchTest extends UnpinPostTest {

	get description () {
		return 'should properly update a codemark when a post is unpinned from it, checked by fetching the codemark';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { codemark: CodemarkTestConstants.EXPECTED_CODEMARK_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.setPath,
			this.unpinPost	// perform the actual unpin
		], callback);
	}

	setPath (callback) {
		this.path = '/codemarks/' + this.codemark.id;
		callback();
	}
	
	// validate that the response is correct
	validateResponse (data) {
		Assert(data.codemark.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the codemark was updated');
		Assert(data.codemark.lastActivityAt >= this.replyCreatedAfter, 'lastActivityAt should be greater than before the reply was posted');
		Assert(data.codemark.lastReplyAt === data.codemark.lastActivityAt, 'lastReplyAt should be equal to lastActivityAt');
		this.expectedCodemark.modifiedAt = data.codemark.modifiedAt;
		this.expectedCodemark.lastActivityAt = data.codemark.lastActivityAt;
		this.expectedCodemark.lastReplyAt = data.codemark.lastReplyAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.codemark, this.expectedCodemark, 'fetched codemark does not match');
	}
}

module.exports = UnpinPostFetchTest;

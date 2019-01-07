'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class DeleteCodemarkFetchTest extends DeleteCodemarkTest {

	get description () {
		return 'should properly deactivate a codemark when deleted, checked by fetching the codemark';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { codemark: CodemarkTestConstants.EXPECTED_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deleteCodemark	// perform the actual deletion
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.codemark.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was updated');
		this.expectedCodemark.modifiedAt = data.codemark.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.codemark, this.expectedCodemark, 'fetched codemark does not match');
	}
}

module.exports = DeleteCodemarkFetchTest;

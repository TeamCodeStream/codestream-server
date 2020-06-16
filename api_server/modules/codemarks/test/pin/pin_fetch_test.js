'use strict';

const PinTest = require('./pin_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class PinFetchTest extends PinTest {

	get description () {
		return 'should properly update a codemark when pinned, checked by fetching the codemark';
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
			this.pinCodemark	// perform the actual pin
		], callback);
	}

	setPath (callback) {
		this.path = '/codemarks/' + this.codemark.id;
		callback();
	}
	
	// validate that the response is correct
	validateResponse (data) {
		Assert(data.codemark.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the codemark was updated');
		this.expectedCodemark.modifiedAt = data.codemark.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.codemark, this.expectedCodemark, 'fetched codemark does not match');
	}
}

module.exports = PinFetchTest;

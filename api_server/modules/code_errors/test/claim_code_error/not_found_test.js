'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');
const Assert = require('assert');

class NotFoundTest extends ClaimCodeErrorTest {

	get description () {
		return 'should return a notFound flag when trying to claim a code error that is not known by CodeStream';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.objectId = this.codeErrorFactory.randomObjectId(this.data.accountId);
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, { notFound: true }, 'response did not include notFound flag set to true');
	}
}

module.exports = NotFoundTest;

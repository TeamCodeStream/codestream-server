'use strict';

const AttachToReviewTest = require('./attach_to_review_test');
const Assert = require('assert');

class ChangeRequestTest extends AttachToReviewTest {

	get description () {
		return 'should be able to attach a codemark to a code review upon creation, and make that codemark a change request';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.isChangeRequest = true;
			callback();
		});
	}

	/* eslint complexity: 0 */
	// validate the response to the post request
	validateResponse (data) {
		Assert.equal(data.codemark.isChangeRequest, true, 'isChangeRequest should be true');
		Assert.equal(data.codemark.status, 'open', 'codemark status should be open');
		this.expectedStatus = 'open';
		super.validateResponse(data);
	}
}

module.exports = ChangeRequestTest;

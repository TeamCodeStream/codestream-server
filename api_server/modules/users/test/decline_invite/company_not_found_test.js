'use strict';

const DeclineInviteTest = require('./decline_invite_test');
const ObjectId = require('mongodb').ObjectId;

class CompanyNotFoundTest extends DeclineInviteTest {

	get description () {
		return 'should return an error when trying to decline an invite from a company that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'company'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/decline-invite/' + ObjectId(); // substitute an ID for a non-existent company
			callback();
		});
	}
}

module.exports = CompanyNotFoundTest;

'use strict';

const ExistingObjectTest = require('./existing_object_test');

class NoMatchAccountIdTest extends ExistingObjectTest {

	get description () {
		return 'should return an error when making a request to create a New Relic comment with an account ID that does not match the account ID of the parent object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	makeNRCommentData (callback) {
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			this.data.accountId = 12345;
			callback();
		});
	}
}

module.exports = NoMatchAccountIdTest;

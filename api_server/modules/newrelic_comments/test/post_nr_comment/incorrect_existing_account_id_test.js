'use strict';

const ExistingObjectTest = require('./existing_object_test');

class IncorrectExistingAccountIdTest extends ExistingObjectTest {

	get description () {
		return 'should return an error when making a request to create a New Relic comment on an existing object but providing an account ID in the header which does not match the account ID of the object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	makeNRCommentData (callback) {
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'] = 'incorrect!';
			callback();
		});
	}
}

module.exports = IncorrectExistingAccountIdTest;

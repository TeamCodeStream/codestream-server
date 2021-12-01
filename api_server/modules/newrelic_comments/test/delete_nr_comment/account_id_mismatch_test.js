'use strict';

const DeleteNRCommentTest = require('./delete_nr_comment_test');

class AccountIdMismatchTest extends DeleteNRCommentTest {

	get description () {
		return 'should return an error when making a request to delete a New Relic comment but providing an account ID header that does not match the account ID of the object that owns the comment';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'accountId given in the header does not match the object'
		};
	}

	setExpectedData (callback) {
		super.setExpectedData(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'] = this.codeErrorFactory.randomAccountId();
			callback();
		});
	}
}

module.exports = AccountIdMismatchTest;

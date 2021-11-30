'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class AccountIdMismatchTest extends GetNRCommentsTest {

	get description () {
		return 'should return an error when making a request to fetch New Relic comments but providing an account ID header that does not match the account ID of the object that owns the comment';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'accountId given in the header does not match the object'
		};
	}

	makeNRCommentData () {
		const data = super.makeNRCommentData();
		this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'] = this.codeErrorFactory.randomAccountId();
		return data;
	}
}

module.exports = AccountIdMismatchTest;

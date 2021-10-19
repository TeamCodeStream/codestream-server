'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');

class NoAccountIdTest extends GetNRCommentTest {

	get description () {
		return 'should return an error when making a request to fetch a New Relic comment but not providing the account ID header';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	makeNRCommentData () {
		const data = super.makeNRCommentData();
		delete this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'];
		return data;
	}
}

module.exports = NoAccountIdTest;

'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');

class NoSecretTest extends GetNRCommentTest {

	get description () {
		return 'should return an error when making a request to fetch a New Relic comment but not providing the secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	makeNRCommentData () {
		const data = super.makeNRCommentData();
		delete this.apiRequestOptions.headers['X-CS-NewRelic-Secret'];
		return data;
	}
}

module.exports = NoSecretTest;

'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class NoSecretTest extends GetNRCommentsTest {

	get description () {
		return 'should return an error when making a request to fetch New Relic comments but not providing the secret';
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

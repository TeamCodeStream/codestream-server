'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');

class IncorrectSecretTest extends GetNRCommentTest {

	get description () {
		return 'should return an error when making a request to fetch a New Relic comment but not providing the correct secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	makeNRCommentData () {
		const data = super.makeNRCommentData();
		this.apiRequestOptions.headers['X-CS-NewRelic-Secret'] = 'incorrect!';
		return data;
	}
}

module.exports = IncorrectSecretTest;

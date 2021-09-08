'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');

class IncorrectSecretTest extends CreateNRCommentTest {

	get description () {
		return 'should return an error when making a request to create a New Relic comment but not providing the correct secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	makeNRCommentData (callback) {
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-NewRelic-Secret'] = 'incorrect!';
			callback();
		});
	}
}

module.exports = IncorrectSecretTest;

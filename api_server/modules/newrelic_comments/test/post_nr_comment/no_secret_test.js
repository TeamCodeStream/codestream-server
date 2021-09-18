'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');

class NoSecretTest extends CreateNRCommentTest {

	get description () {
		return 'should return an error when making a request to create a New Relic comment but not providing the secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	makeNRCommentData (callback) {
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-NewRelic-Secret'];
			callback();
		});
	}
}

module.exports = NoSecretTest;

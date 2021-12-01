'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');

class NoSecretTest extends UpdateNRCommentTest {

	get description () {
		return 'should return an error when making a request to update a New Relic comment but not providing the secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	makeUpdateData (callback) {
		super.makeUpdateData(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-NewRelic-Secret'];
			callback();
		});
	}
}

module.exports = NoSecretTest;

'use strict';

const DeleteNRCommentTest = require('./delete_nr_comment_test');

class NoAccountIdTest extends DeleteNRCommentTest {

	get description () {
		return 'should return an error when making a request to delete a New Relic comment but not providing the account ID header';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	setExpectedData (callback) {
		super.setExpectedData(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'];
			callback();
		});
	}
}

module.exports = NoAccountIdTest;

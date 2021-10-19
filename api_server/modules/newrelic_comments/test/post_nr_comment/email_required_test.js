'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');

class EmailRequiredTest extends CreateNRCommentTest {

	get description () {
		return `should return an error when trying to create a New Relic comment with no email for the creator`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'creator.email'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.creator.email;
			callback();
		});
	}
}

module.exports = EmailRequiredTest;

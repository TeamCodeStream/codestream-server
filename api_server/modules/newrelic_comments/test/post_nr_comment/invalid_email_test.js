'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const RandomString = require('randomstring');

class InvalidEmailTest extends CreateNRCommentTest {

	get description () {
		return `should return an error when trying to create a New Relic comment with an invalid email for the creator`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid email'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.creator.email = RandomString.generate(10);
			callback();
		});
	}
}

module.exports = InvalidEmailTest;

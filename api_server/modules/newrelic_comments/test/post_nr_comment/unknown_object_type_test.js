'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');

class UnknownObjectTypeTest extends CreateNRCommentTest {

	get description () {
		return `should return an error when trying to create a New Relic comment with an unknown object type`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'objectType is not an accepted code error type'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.objectType = 'unknown';
			callback();
		});
	}
}

module.exports = UnknownObjectTypeTest;

'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends UpdateNRCommentTest {

	get description () {
		return 'should return an error when trying to update a New Relic comment that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// try to get a bogus marker, with an ID that doesn't exist
			this.path = '/nr-comments/' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;

'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');
const ObjectID = require('mongodb').ObjectID;

class NotFoundTest extends GetNRCommentTest {

	get description () {
		return 'should return an error when trying to fetch a New Relic comment that doesn\'t exist';
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
			this.path = '/nr-comments/' + ObjectID();
			callback();
		});
	}
}

module.exports = NotFoundTest;

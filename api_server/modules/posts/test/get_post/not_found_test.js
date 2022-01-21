'use strict';

const GetPostTest = require('./get_post_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends GetPostTest {

	get description () {
		return 'should return an error when trying to fetch a post that doesn\'t exist';
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
			// set the path to fetch some random post that doesn't exist
			this.path = '/posts/' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;

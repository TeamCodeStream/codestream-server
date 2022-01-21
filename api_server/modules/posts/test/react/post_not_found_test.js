'use strict';

const ReactTest = require('./react_test');
const ObjectId = require('mongodb').ObjectId;

class PostNotFoundTest extends ReactTest {

	get description () {
		return 'should return an error when trying to react to a post in a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'post'
		};
	}

	// form the data for the reaction
	makePostData (callback) {
		// substitute a non-existent post ID
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.path = '/react/' + ObjectId();
			callback();
		});
	}
}

module.exports = PostNotFoundTest;

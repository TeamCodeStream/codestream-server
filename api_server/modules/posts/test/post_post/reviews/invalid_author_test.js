'use strict';

const AuthorsTest = require('./authors_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidAuthorTest extends AuthorsTest {

	get description () {
		return 'should return an error if an unknown user is added as an author of code for a review created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			const bogusAuthorId = ObjectID();
			this.data.review.authorsById[bogusAuthorId] = {
				stomped: Math.floor(Math.random() * 10),
				commits: Math.floor(Math.random() * 10)
			};
			callback();
		});
	}
}

module.exports = InvalidAuthorTest;

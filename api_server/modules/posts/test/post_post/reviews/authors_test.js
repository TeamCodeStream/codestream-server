'use strict';

const ReviewTest = require('./review_test');
const Assert = require('assert');

class AuthorsTest extends ReviewTest {

	get description () {
		return 'should return a valid post and review with correct authors when creating a post with a review with a code authors provided';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 5;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			// add some authors
			this.data.review.authorsById = {
				[this.users[2].user.id]: {
					stomped: Math.floor(Math.random() * 10),
					commits: Math.floor(Math.random() * 10)
				},
				[this.users[4].user.id]: {
					stomped: Math.floor(Math.random() * 10),
					commits: Math.floor(Math.random() * 10)
				}
			};
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepEqual(data.review.authorsById, this.data.review.authorsById, 'authorsById not correct in response');
		super.validateResponse(data);
	}
}

module.exports = AuthorsTest;

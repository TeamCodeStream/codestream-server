'use strict';

const ReviewTest = require('./review_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidRepoIdInChangeSetTest extends ReviewTest {

	get description () {
		return 'should return an error if an invalid repo ID is included in the change set for a review that is included with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.repoChangeset[0].repoId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidRepoIdInChangeSetTest;

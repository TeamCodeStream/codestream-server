'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');

class NonChildPostTest extends GetNRCommentTest {

	get description () {
		return 'should return an error when trying to fetch a post that isn\'t a New Relic comment and does not have a parent';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'unable to fetch non-child post'
		};
	}

	// before the test runs...
	before (callback) {
		Object.assign(this.postOptions, {
			creatorIndex: 1
		});
		super.before(error => {
			if (error) { return callback(error); }
			// point to a post that is not an NR comment
			this.path = '/nr-comments/' + this.postData[0].post.id;
			callback();
		});
	}
}

module.exports = NonChildPostTest;

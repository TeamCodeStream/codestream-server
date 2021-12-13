'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');

class NoCodeErrorPostTest extends UpdateNRCommentTest {

	get description () {
		return 'should return an error when trying to update the post pointing to a code error';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'unable to fetch non-child post'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/nr-comments/' + this.nrCommentResponse.codeStreamResponse.codeErrorPost.id;
			callback();
		});
	}
}

module.exports = NoCodeErrorPostTest;

'use strict';

const CodeErrorTest = require('./code_error_test');

class NoReviewAndCodeErrorTest extends CodeErrorTest {

	get description () {
		return 'should return an error if a post is sent with both code error and review info';
	}

	getExpectedError () {
		return {
			code: 'POST-1008'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review = this.reviewFactory.getRandomReviewData({ numChanges: 1});
			callback();
		});
	}
}

module.exports = NoReviewAndCodeErrorTest;

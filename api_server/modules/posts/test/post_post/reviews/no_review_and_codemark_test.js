'use strict';

const ReviewTest = require('./review_test');

class NoReviewAndCodemarkTest extends ReviewTest {

	get description () {
		return 'should return an error if a post is sent with both codemark and review info';
	}

	getExpectedError () {
		return {
			code: 'POST-1002'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark = this.codemarkFactory.getRandomCodemarkData();
			callback();
		});
	}
}

module.exports = NoReviewAndCodemarkTest;

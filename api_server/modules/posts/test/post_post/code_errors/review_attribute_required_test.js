'use strict';

const ReviewTest = require('./review_test');

class ReviewAttributeRequiredTest extends ReviewTest {

	get description () {
		return `should return an error when attempting to create a review with no ${this.attribute} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the review attribute
		super.makePostData(() => {
			delete this.data.review[this.attribute];
			callback();
		});
	}
}

module.exports = ReviewAttributeRequiredTest;

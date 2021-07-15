'use strict';

const AddTagsTest = require('./add_tags_test');

class PushBecomesAddToSetTagsTest extends AddTagsTest {

	get description () {
		return 'should return the updated review and correct directive when adding multiple tags to a review, using $push instead of $addToSet';
	}
   
	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(() => {
			this.data.$push = this.data.$addToSet;
			delete this.data.$addToSet;
			callback();
		});
	}
}

module.exports = PushBecomesAddToSetTagsTest;

'use strict';

const AddTagsTest = require('./add_tags_test');

class PushMergesToAddToSetTagsTest extends AddTagsTest {

	get description () {
		return 'should return the updated review and correct directive when adding multiple tags to a review, using $push and $addToSet';
	}
   
	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(() => {
			this.data.$push = { tags: [this.data.$addToSet.tags[0]] };
			this.data.$addToSet.tags.splice(0, 1);
			callback();
		});
	}
}

module.exports = PushMergesToAddToSetTagsTest;

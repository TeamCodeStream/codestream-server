'use strict';

const RemoveTagTest = require('./remove_tag_test');

class RemoveTagsTest extends RemoveTagTest {

	get description () {
		return 'should return the updated review and correct directive when removing multiple tags from a review';
	}
   
	// get the tags we want to remove from the review
	getRemovedTags () {
		return ['_yellow', this.tagIds[1]];
	}
}

module.exports = RemoveTagsTest;

'use strict';

const AddTagsFetchTest = require('./add_tags_fetch_test');

class AddTagFetchTest extends AddTagsFetchTest {

	get description () {
		return 'should properly update a review when requested, when a tag is added to the review, checked by fetching the review';
	}

	// get the tags we want to add to the review
	getAddedTags () {
		return ['_blue'];
	}
}

module.exports = AddTagFetchTest;

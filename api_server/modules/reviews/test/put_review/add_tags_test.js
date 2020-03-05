'use strict';

const AddTagTest = require('./add_tag_test');

class AddTagsTest extends AddTagTest {

	constructor (options) {
		super(options);
		this.wantCustomTags = true;
	}
	get description () {
		return 'should return the updated review and correct directive when adding multiple tags to a review';
	}
   
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.numAdditionalInvites = 2;
			this.userOptions.numRegistered = 4;
			callback();
		});
	}

	// get the users we want to add to the tag
	getAddedTags () {
		return ['_red', this.tagIds[1]];
	}
}

module.exports = AddTagsTest;

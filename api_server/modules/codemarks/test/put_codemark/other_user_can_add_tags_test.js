'use strict';

const TagsTest = require('./tags_test');

class OtherUserCanAddTagsTest extends TagsTest {

	get description () {
		return 'a team member should be able to change the tags for a codemark';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			this.data = { tags: this.data.tags };	// remove everything but the tags
			const setAttributes = this.expectedData.codemark.$set;
			this.expectedData.codemark.$set = {
				tags: this.data.tags,
				modifiedAt: setAttributes.modifiedAt,
				version: setAttributes.version
			};
			callback();
		});
	}
}

module.exports = OtherUserCanAddTagsTest;
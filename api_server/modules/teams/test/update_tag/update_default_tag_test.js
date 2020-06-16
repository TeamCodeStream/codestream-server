'use strict';

const UpdateTagTest = require('./update_tag_test');
const DefaultTags = require('../../default_tags');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class UpdateDefaultTagTest extends UpdateTagTest {

	get description () {
		return 'should be ok to update one of the default tags for a team';
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a tag, but...
		super.before(error => {
			if (error) { return callback(error); }
			// make it one of the default tags we will update
			const tagId = Object.keys(DefaultTags)[3];
			this.path = `/team-tags/${this.team.id}/${tagId}`;
			delete this.expectedResponse.team.$set[`tags.${this.tagId}`];
			this.tagId = tagId;
			this.expectedResponse.team.$set[`tags.${tagId}`] = this.data;
			this.expectedTags = { ...DeepClone(DefaultTags), ...this.tagsCreated };
			this.expectedTags[this.tagId] = { ...this.data };
			callback();
		});
	}
}

module.exports = UpdateDefaultTagTest;

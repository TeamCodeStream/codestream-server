'use strict';

const DeleteTagTest = require('./delete_tag_test');
const DefaultTags = require('../../default_tags');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class DeleteDefaultTagTest extends DeleteTagTest {

	get description () {
		return 'should be ok to delete one of the default tags for a team';
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a tag, but...
		super.before(error => {
			if (error) { return callback(error); }
			// make it one of the default tags we will update
			const tagId = Object.keys(DefaultTags)[3];
			this.path = `/team-tags/${this.team.id}/${tagId}`;
			delete this.expectedResponse.team.$set[`tags.${this.tagId}.deactivated`];
			this.expectedResponse.team.$set[`tags.${tagId}.deactivated`] = true;
			delete this.expectedTags[this.tagId].deactivated;
			this.tagId = tagId;
			this.expectedTags = { ...DeepClone(DefaultTags), ...this.tagsCreated };
			this.expectedTags[this.tagId].deactivated = true;
			callback();
		});
	}
}

module.exports = DeleteDefaultTagTest;

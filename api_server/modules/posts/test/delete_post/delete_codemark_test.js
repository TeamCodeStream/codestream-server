'use strict';

const DeletePostTest = require('./delete_post_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class DeleteCodemarkTest extends DeletePostTest {

	get description () {
		return 'should delete associated codemark when a post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantCodemark = true;
			callback();
		});
	}

	setExpectedData (callback) {
		const postData = this.postData[0];
		super.setExpectedData(() => {
			this.expectedData.codemarks = [{
				_id: postData.codemark.id,	// DEPRECATE ME
				id: postData.codemark.id,
				$set: {
					deactivated: true,
					modifiedAt: Date.now(),	// placeholder
					relatedCodemarkIds: [],
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}];
			this.expectedCodemark = DeepClone(postData.codemark);
			Object.assign(this.expectedCodemark, this.expectedData.codemarks[0].$set);
			callback();
		});
	}

	validateResponse (data) {
		const codemark = data.codemarks[0];
		Assert(codemark.$set.modifiedAt >= this.modifiedAfter, 'codemark modifiedAt is not greater than before the post was deleted');
		this.expectedData.codemarks[0].$set.modifiedAt = codemark.$set.modifiedAt;
		this.validateSanitized(codemark.$set, PostTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = DeleteCodemarkTest;

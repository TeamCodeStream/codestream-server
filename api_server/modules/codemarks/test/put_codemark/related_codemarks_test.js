'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const Assert = require('assert');

class RelatedCodemarksTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.wantRelatedCodemarks = true;
	}

	get description () {
		return 'should allow related codemarks when updating a codemark, and should update the related codemarks to be related to the updated codemark';
	}

	// validate the response to the test request
	validateResponse (data) {
		for (let relatedCodemarkId of this.addedRelatedCodemarkIds) {
			const updatedCodemark = data.codemarks.find(updatedCodemark => {
				return updatedCodemark.id === relatedCodemarkId;
			});
			Assert(updatedCodemark, 'related codemark not found to be updated');
			Assert(updatedCodemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt not properly set for related codemark');
			const expectedCodemark = this.expectedData.codemarks.find(expectedCodemark => {
				return expectedCodemark.id === relatedCodemarkId;
			});
			expectedCodemark.$set.modifiedAt = updatedCodemark.$set.modifiedAt;
		}
		super.validateResponse(data);
	}
}

module.exports = RelatedCodemarksTest;

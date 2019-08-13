'use strict';

const DeleteMarkerTest = require('./delete_marker_test');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class DeleteRelationsTest extends DeleteMarkerTest {

	constructor (options) {
		super(options);
		this.wantRelatedCodemarks = true;
	}

	get description () {
		return 'should delete the relations with other codemarks when a codemark is deleted';
	}

	validateResponse (data) {
		data.codemarks.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedData.codemarks.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.relatedCodemarks.forEach(relatedCodemark => {
			const returnedRelatedCodemark = data.codemarks.find(returnedCodemark => {
				return returnedCodemark.id === relatedCodemark.id;
			});
			Assert(returnedRelatedCodemark.$set.modifiedAt >= this.modifiedAfter, 'related codemark modifiedAt is not greater than before the codemark was deleted');
			const expectedCodemark = this.expectedData.codemarks.find(expectedCodemark => {
				return expectedCodemark.id === relatedCodemark.id;
			});
			expectedCodemark.$set.modifiedAt = returnedRelatedCodemark.$set.modifiedAt;
			this.validateSanitized(returnedRelatedCodemark.$set, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);
		});
		super.validateResponse(data);
	}
}

module.exports = DeleteRelationsTest;

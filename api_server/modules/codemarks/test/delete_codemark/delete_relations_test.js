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
		this.expectedData.codemarks.forEach(expectedCodemark => {
			const returnedCodemark = data.codemarks.find(c => {
				return c.id === expectedCodemark.id;
			});
			Assert(returnedCodemark.$set.modifiedAt >= this.modifiedAfter, 'returned codemark modifiedAt is not greater than before the codemark was deleted');
			expectedCodemark.$set.modifiedAt = returnedCodemark.$set.modifiedAt;
			this.validateSanitized(returnedCodemark.$set, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);
		});
		super.validateResponse(data);
	}
}

module.exports = DeleteRelationsTest;

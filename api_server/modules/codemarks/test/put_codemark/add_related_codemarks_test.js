'use strict';

const RelatedCodemarksTest = require('./related_codemarks_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AddRelatedCodemarksTest extends RelatedCodemarksTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		return 'should allow related codemarks to be added when updating a codemark, and should update the related codemarks to be related to the updated codemark';
	}

	// override making the postless codemark, to create some codemarks first, and then relate those,
	// so they are "pre-related" to the codemark when we do the test
	makePostlessCodemark (callback) {
		this.data = { relatedCodemarkIds: [] };
		BoundAsync.series(this, [
			this.createRelatedCodemarks,
			super.makePostlessCodemark
		], callback);
	}

	// add the codemarks we have already created to the list of related codemarks for the test codemark to be created
	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		data.relatedCodemarkIds = this.prerelatedCodemarkIds = this.data.relatedCodemarkIds;
		return data;
	}
}

module.exports = AddRelatedCodemarksTest;

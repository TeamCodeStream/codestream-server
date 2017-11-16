'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplyNoPullByIdTest extends GetByIdTest {

	get description () {
		return 'should get an unchanged document after applying a no-op pull operation to a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const update = {
			array: 8
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ pull: update },
			callback
		);
	}
}

module.exports = ApplyNoPullByIdTest;

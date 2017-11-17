'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplyNoAddByIdTest extends GetByIdTest {

	get description () {
		return 'should get an unchanged document after applying a no-op add operation to a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const update = {
			array: 4
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$addToSet': update },
			callback
		);
	}
}

module.exports = ApplyNoAddByIdTest;

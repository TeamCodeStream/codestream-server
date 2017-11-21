'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplyPullByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after applying a pull operation to a document';
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
			{ '$pull': update },
			(error) => {
				if (error) { return callback(error); }
				let index = this.testDocument.array.indexOf(4);
				this.testDocument.array.splice(index, 1);
				callback();
			}
		);
	}
}

module.exports = ApplyPullByIdTest;

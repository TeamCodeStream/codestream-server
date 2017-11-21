'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplyAddByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after applying an add operation to a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const update = {
			array: 7
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$addToSet': update },
			(error) => {
				if (error) { return callback(error); }
				this.testDocument.array.push(7);
				callback();
			}
		);
	}
}

module.exports = ApplyAddByIdTest;

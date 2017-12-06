'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplyIncByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after applying an increment operation to a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const update = {
			number: 5
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$inc': update },
			(error) => {
				if (error) { return callback(error); }
				this.testDocument.number += 5;
				callback();
			}
		);
	}
}

module.exports = ApplyIncByIdTest;

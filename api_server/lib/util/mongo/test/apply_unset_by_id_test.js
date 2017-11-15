'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplyUnsetByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after applying an unset operation to a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const update = {
			text: 1,
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ unset: update },
			(error) => {
				if (error) { return callback(error); }
				delete this.testDocument.text;
				callback();
			}
		);
	}
}

module.exports = ApplyUnsetByIdTest;

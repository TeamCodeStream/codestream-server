'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class ApplySetByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after applying a set operation to a document';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$set': update },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testDocument, update);
				callback();
			}
		);
	}
}

module.exports = ApplySetByIdTest;

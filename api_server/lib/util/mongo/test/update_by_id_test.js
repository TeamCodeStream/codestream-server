'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');

class UpdateByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after updating a document by ID';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// set up mongo client and create a test document
			this.updateDocument	// update the document
		], callback);
	}

	updateDocument (callback) {
		// update the document and verify the update took
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.updateById(
			this.testDocument._id,
			update,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testDocument, update);
				callback();
			}
		);
	}
}

module.exports = UpdateByIdTest;

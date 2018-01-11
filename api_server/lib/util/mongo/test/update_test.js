'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var GetByIdTest = require('./get_by_id_test');

class UpdateTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after updating a document';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// set up mongo client and create a test document
			this.updateDocument	// update the test document
		], callback);
	}

	updateDocument (callback) {
		// do the update and verify that it took
		const update = {
			_id: this.testDocument._id,
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testDocument, update);
				callback();
			}
		);
	}
}

module.exports = UpdateTest;

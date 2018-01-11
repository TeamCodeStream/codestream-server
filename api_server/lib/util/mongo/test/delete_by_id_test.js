'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var MongoTest = require('./mongo_test');

class DeleteByIdTest extends MongoTest {

	get description () {
		return 'should not get a document after it has been deleted';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,						// set up mongo client
			this.createTestAndControlDocument,	// create a test document and a control document
			this.deleteDocument					// delete the test document
		], callback);
	}

	// delete the test document
	deleteDocument (callback) {
		this.data.test.deleteById(
			this.testDocument._id,
			callback
		);
	}

	// run the test...
	run (callback) {
		// we'll fetch the test and control documents, but since we deleted the test document,
		// we should only get the control document
		this.testDocuments = [this.controlDocument];
		this.data.test.getByIds(
			[this.testDocument._id, this.controlDocument._id],
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = DeleteByIdTest;

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class GetByIdTest extends MongoTest {

	get description () {
		return 'should get the correct document when getting a document by ID';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,						// set up mongo
			this.createTestAndControlDocument,	// create a test and control document
		], callback);
	}

	// run the test...
	run (callback) {
		// get the test document and check that it matches
		this.data.test.getById(
			this.testDocument._id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateDocumentResponse();
	}
}

module.exports = GetByIdTest;

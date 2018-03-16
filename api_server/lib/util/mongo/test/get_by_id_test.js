'use strict';

var MongoTest = require('./mongo_test');

class GetByIdTest extends MongoTest {

	get description () {
		return 'should get the correct document when getting a document by ID';
	}

	// before the test runs...
	async before (callback) {
		try {
			await super.before();							// set up mongo
			await this.createTestAndControlDocument();	// create a test and control document
		}
		catch (error) {
			if (callback) {
				callback(error);
			}
			else {
				throw error;
			}
		}
		if (callback) {
			callback();
		}
	}

	// run the test...
	async run (callback) {
		// get the test document and check that it matches
		let response;
		try {
			response = await this.data.test.getById(this.testDocument._id);
		}
		catch (error) {
			this.checkResponse(error, response, callback);
		}
		this.checkResponse(null, response, callback);
	}

	validateResponse () {
		this.validateDocumentResponse();
	}
}

module.exports = GetByIdTest;

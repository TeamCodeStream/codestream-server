'use strict';

const MongoTest = require('./mongo_test');
const Assert = require('assert');

class GetByIdTest extends MongoTest {

	get description () {
		return 'should get the correct document when getting a document by ID';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				await this.createTestAndControlDocument();	// create a test and control document
			}
			catch (error) {
				return callback(error);
			}
			callback();
		});
	}

	// run the test...
	run (callback) {
		(async () => {
			// get the test document and check that it matches
			let response;
			try {
				response = await this.data.test.getById(this.testDocument.id);
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}


	validateResponse () {
		if (this.expectedOp) {
			Assert.deepEqual(this.actualOp, this.expectedOp, 'output op not correct');
		}
		this.validateDocumentResponse();
	}
}

module.exports = GetByIdTest;

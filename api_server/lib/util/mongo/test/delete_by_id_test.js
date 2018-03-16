'use strict';

var MongoTest = require('./mongo_test');

class DeleteByIdTest extends MongoTest {

	get description () {
		return 'should not get a document after it has been deleted';
	}

	// before the test runs...
	async before (callback) {
		try {
			await super.before();						// set up mongo client
			await this.createTestAndControlDocument();	// create a test document and a control document
			await this.deleteDocument();				// delete the test document
		}
		catch (error) {
			callback(error);
		}
		callback();
	}

	// delete the test document
	async deleteDocument () {
		await this.data.test.deleteById(this.testDocument._id);
	}

	// run the test...
	async run (callback) {
		// we'll fetch the test and control documents, but since we deleted the test document,
		// we should only get the control document
		this.testDocuments = [this.controlDocument];
		let response;
		try {
			const ids = [this.testDocument._id, this.controlDocument._id];
			response = await this.data.test.getByIds(ids);
		}
		catch (error) {
			this.checkResponse(error, response, callback);
		}
		this.checkResponse(null, response, callback);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = DeleteByIdTest;

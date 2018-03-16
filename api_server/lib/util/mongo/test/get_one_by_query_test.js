'use strict';

var MongoTest = require('./mongo_test');

class GetOneByQueryTest extends MongoTest {

	get description () {
		return 'should get the correct document when getting one document by query';
	}

	//  before the test runs...
	async before (callback) {
		try {
			await super.before();				// set up mongo client
			await this.createRandomDocuments();	// create a series of random documents
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	async run (callback) {
		// pick one to fetch, and verify we get the one we want
		this.testDocument = this.documents[4];
		let response;
		try {
			response = await this.data.test.getOneByQuery(
				{
					text: this.testDocument.text,
					flag: this.testDocument.flag
				}
			);
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

module.exports = GetOneByQueryTest;

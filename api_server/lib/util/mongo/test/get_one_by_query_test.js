'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var MongoTest = require('./mongo_test');

class GetOneByQueryTest extends MongoTest {

	get description () {
		return 'should get the correct document when getting one document by query';
	}

	//  before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomDocuments	// create a series of random documents
		], callback);
	}

	run (callback) {
		// pick one to fetch, and verify we get the one we want
		this.testDocument = this.documents[4];
		this.data.test.getOneByQuery(
			{
				text: this.testDocument.text,
				flag: this.testDocument.flag
			},
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateDocumentResponse();
	}
}

module.exports = GetOneByQueryTest;

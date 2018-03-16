'use strict';

var MongoTest = require('./mongo_test');

class GetByIdsTest extends MongoTest {

	get description () {
		return 'should get the correct documents when getting several documents by ID';
	}

	// before the test runs...
	async before (callback) {
		try {
			await super.before();					// set up mongo client
			await this.createRandomDocuments();		// create a series of random documents
			await this.filterTestDocuments();		// filter down to the ones we want`
		}
		catch (error) {
			callback(error);
		}
		callback();
	}

	// run the test...
	async run (callback) {
		// get the documents we want, and verify we didn't get any others
		let ids = this.testDocuments.map(document => { return document._id; });
		let response;
		try {
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

module.exports = GetByIdsTest;

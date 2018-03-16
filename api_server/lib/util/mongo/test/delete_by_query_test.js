'use strict';

var MongoTest = require('./mongo_test');

class DeleteByQueryTest extends MongoTest {

	get description () {
		return 'should not get documents after they have been deleted by query';
	}

	async before (callback) {
		try {
			await super.before();					// set up mongo client
			await this.createRandomDocuments();		// create a set of random documents
			await this.filterTestDocuments();		// filter down to our test documents
			await this.deleteDocuments();			// delete the rest of the documents (not the test documents)
		}
		catch (error) {
			callback(error);
		}
		callback();
	}

	// with a query, delete the documents we don't want returned in the results
	async deleteDocuments () {
		await this.data.test.deleteByQuery(
			{ flag: this.randomizer + 'no' }
		);
	}

	// run the test...
	async run (callback) {
		// fetch all the test documents, but we should only get back the ones we didn't delete
		const ids = this.documents.map(document => { return document._id; });
		let response;
		try {
			response = await this.data.test.getByIds(ids);
		}
		catch (error) {
			this.checkResponse(error, response, callback);
		}
		callback(null, response, callback);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = DeleteByQueryTest;

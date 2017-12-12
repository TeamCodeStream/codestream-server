'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class DeleteByQueryTest extends MongoTest {

	get description () {
		return 'should not get documents after they have been deleted by query';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,					// set up mongo client
			this.createRandomDocuments,		// create a set of random documents
			this.filterTestDocuments,		// filter down to our test documents
			this.deleteDocuments			// delete the rest of the documents (not the test documents)
		], callback);
	}

	// with a query, delete the documents we don't want returned in the results
	deleteDocuments (callback) {
		this.data.test.deleteByQuery(
			{ flag: this.randomizer + 'no' },
			callback
		);
	}

	// run the test...
	run (callback) {
		// fetch all the test documents, but we should only get back the ones we didn't delete
		let ids = this.documents.map(document => { return document._id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = DeleteByQueryTest;

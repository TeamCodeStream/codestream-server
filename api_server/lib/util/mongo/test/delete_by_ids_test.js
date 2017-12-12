'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class DeleteByIdsTest extends MongoTest {

	get description () {
		return 'should not get documents after they have been deleted by ID';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomDocuments,	// create a set of random documents
			this.filterTestDocuments,	// filter down to the documents we will NOT delete
			this.deleteDocuments		// delete some of the documents
		], callback);
	}

	// delete a subset of our test documents
	deleteDocuments (callback) {
		// delete only the documents we DON'T want to be returned
		let toDelete = this.documents.filter(document => {
			return !this.wantN(document.number);
		});
		let ids = toDelete.map(document => { return document._id; });
		this.data.test.deleteByIds(
			ids,
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

module.exports = DeleteByIdsTest;

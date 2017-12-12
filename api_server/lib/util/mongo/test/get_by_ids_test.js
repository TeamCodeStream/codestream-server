'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class GetByIdsTest extends MongoTest {

	get description () {
		return 'should get the correct documents when getting several documents by ID';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,					// set up mongo client
			this.createRandomDocuments,		// create a series of random documents
			this.filterTestDocuments		// filter down to the ones we want`
		], callback);
	}

	// run the test...
	run (callback) {
		// get the documents we want, and verify we didn't get any others
		let ids = this.testDocuments.map(document => { return document._id; });
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

module.exports = GetByIdsTest;

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class GetByQueryTest extends MongoTest {

	get description () {
		return 'should get the correct documents when getting several documents by query';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client`
			this.createRandomDocuments,	// create a series of random documents`
			this.filterTestDocuments	// filter down to the documents we want`
		], callback);
	}

	// run the test...
	run (callback) {
		// do the query 
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByQueryTest;

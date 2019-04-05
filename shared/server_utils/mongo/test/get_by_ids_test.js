'use strict';

const MongoTest = require('./mongo_test');

class GetByIdsTest extends MongoTest {

	get description () {
		return 'should get the correct documents when getting several documents by ID';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				await this.createRandomDocuments();		// create a series of random documents
				await this.filterTestDocuments();		// filter down to the ones we want`
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
			// get the documents we want, and verify we didn't get any others
			let ids = this.testDocuments.map(document => { return document.id; });
			let response;
			try {
				response = await this.data.test.getByIds(ids);
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsTest;

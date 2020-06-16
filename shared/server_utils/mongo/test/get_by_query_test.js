'use strict';

const MongoTest = require('./mongo_test');

class GetByQueryTest extends MongoTest {

	get description () {
		return 'should get the correct documents when getting several documents by query';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				await this.createRandomDocuments();	// create a series of random documents
				await this.filterTestDocuments();	// filter down to the documents we want
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
			// do the query
			let response;
			try {
				response = await this.data.test.getByQuery(
					{ flag: this.randomizer + 'yes' }
				);
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

module.exports = GetByQueryTest;

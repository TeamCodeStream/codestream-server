'use strict';

const MongoTest = require('./mongo_test');
const Assert = require('assert');

class GetByIdNotFoundTest extends MongoTest {

	get description () {
		return 'should get null when getting document that does not exist';
	}

	// run the test...
	run (callback) {
		(async () => {
			// get an unused ID and use it to fetch a document, should get nothing
			const nextId = this.data.test.createId();
			let response;
			try {
				response = await this.data.test.getById(nextId);
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}

	validateResponse () {
		Assert(this.response === null, 'response must be null');
	}
}

module.exports = GetByIdNotFoundTest;

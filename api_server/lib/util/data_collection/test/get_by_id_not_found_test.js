'use strict';

var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class GetByIdNotFoundTest extends DataCollectionTest {

	get description () {
		return 'should get null when getting model that does not exist';
	}

	run (callback) {
		// fetch a new ID (not yet assigned to a document) and try to fetch 
		let nextId = this.data.test.createId();
		this.data.test.getById(
			nextId,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		Assert(this.response === null, 'response must be null');
	}
}

module.exports = GetByIdNotFoundTest;

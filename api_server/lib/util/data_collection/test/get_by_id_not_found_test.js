'use strict';

const DataCollectionTest = require('./data_collection_test');
const Assert = require('assert');

class GetByIdNotFoundTest extends DataCollectionTest {

	get description () {
		return 'should get null when getting model that does not exist';
	}

	async run () {
		// fetch a new ID (not yet assigned to a document) and try to fetch
		const nextId = this.data.test.createId();
		const response = await this.data.test.getById(nextId);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		Assert(this.response === null, 'response must be null');
	}
}

module.exports = GetByIdNotFoundTest;

'use strict';

const DataCollectionTest = require('./data_collection_test');

class GetByQueryTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by query';
	}

	// before the test...
	async before () {
		await super.before();				// set up mongo client
		await this.createRandomModels();	// create a series of random models
		await this.persist();				// persist those models to the database
		await this.filterTestModels();		// filter our test models to the ones we want
	}

	// run the test...
	async run () {
		// do the query
		const response = await this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' }
		);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByQueryTest;

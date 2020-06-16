'use strict';

const DataCollectionTest = require('./data_collection_test');
const Assert = require('assert');

class UpdateDirectTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models after they are directly updated';
	}

	// before the test...
	async before () {
		await super.before();				// set up mongo client
		await this.createRandomModels();	// create a series of random models
		await this.persist();				// persist those models to the database
		await this.clearCache();			// clear the local cache
		await this.updateModels();			// update those models using a direct update (bypassing cache)
	}

	// update our test models using a direct update query, which bypasses the cache
	async updateModels () {
		// do a direct update to change the text of our test models
		const regexp = new RegExp(`^${this.randomizer}yes$`);
		await this.data.test.updateDirect(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} }
		);
	}

	// run the test...
	async run () {
		// query the database directly for our test models
		const ids = this.models.map(model => { return model.id; });
		const response = await this.mongoData.test.getByIds(ids);
		await this.checkResponse(null, response);
	}

	// validate the response
	validateResponse () {
		// check that our test models have the update, and the other models don't
		Assert(this.response instanceof Array, 'response must be an array');
		Assert(this.response.length === this.models.length);
		this.response.forEach(responseObject => {
			if (this.wantN(responseObject.number)) {
				Assert(responseObject.text === 'goodbye', `expected model ${responseObject.id} wasn't updated`);
			}
			else {
				Assert(responseObject.text === 'hello' + responseObject.number, `model ${responseObject.id} seems to have been improperly updated`);
			}
		});
	}
}

module.exports = UpdateDirectTest;

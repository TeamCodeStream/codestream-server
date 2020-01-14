'use strict';

const DataCollectionTest = require('./data_collection_test');
const Assert = require('assert');

class UpdateWhenPersistTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models after they are directly updated but delayed until persistence';
	}

	// before the test...
	async before () {
		await super.before();				// set up mongo client
		await this.createRandomModels();	// create a series of random models
		await this.persist();				// persist those models to the database
		await this.clearCache();			// clear the local cache
		await this.updateModels();			// update those models using a direct update (bypassing cache)
		await this.verifyUnchanged();		// verify the models, as read from disk, are unchanged, since the updates aren't persisted yet
		await this.persist();				// persist the update query to the database
	}

	// update our test models using a direct update query, which bypasses the cache
	async updateModels () {
		// do a direct update to change the text of our test models
		const regexp = new RegExp(`^${this.randomizer}yes$`);
		await this.data.test.updateDirectWhenPersist(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} }
		);
	}

	// verify the test models on disk are unchanged, since we haven't yet persisted the
	// direct query
	async verifyUnchanged () {
		// query the database directly for our test models, verify the
		// update query has not yet persisted
		const ids = this.models.map(model => model.id);
		const response = await this.mongoData.test.getByIds(ids);
		response.forEach(responseObject => {
			Assert(responseObject.text === 'hello' + responseObject.number, `model ${responseObject.id} was persisted`);
		});
	}

	// run the test...
	async run () {
		// query the database directly for our test models
		const ids = this.models.map(model => model.id);
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

module.exports = UpdateWhenPersistTest;

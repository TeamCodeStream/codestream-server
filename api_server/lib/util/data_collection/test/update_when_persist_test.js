'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class UpdateWhenPersistTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models after they are directly updated but delayed until persistence';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomModels,	// create a series of random models
			this.persist,				// persist those models to the database
			this.clearCache,			// clear the local cache
			this.updateModels,			// update those models using a direct update (bypassing cache)
			this.verifyUnchanged,		// verify the models, as read from disk, are unchanged, since the updates aren't persisted yet
			this.persist				// persist the update query to the database
		], callback);
	}

	// update our test models using a direct update query, which bypasses the cache
	updateModels (callback) {
		(async () => {
			// do a direct update to change the text of our test models
			const regexp = new RegExp(`^${this.randomizer}yes$`);
			try {
				await this.data.test.updateDirectWhenPersist(
					{ flag: regexp },
					{ $set: { text: 'goodbye'} }
				);
			}
			catch (error) {
				return callback(error);
			}
			callback();
		})();
	}

	// verify the test models on disk are unchanged, since we haven't yet persisted the
	// direct query
	verifyUnchanged (callback) {
		(async () => {
			// query the database directly for our test models, verify the
			// update query has not yet persisted
			const ids = this.models.map(model => model.id);
			let response;
			try {
				response = await this.mongoData.test.getByIds(ids);
			}
			catch (error) {
				return callback(error);
			}
			response.forEach(responseObject => {
				Assert(responseObject.text === 'hello' + responseObject.number, `model ${responseObject.id} was persisted`);
			});
			callback();
		})();
	}

	// run the test...
	run (callback) {
		(async () => {
			// query the database directly for our test models
			const ids = this.models.map(model => model.id);
			let response;
			try {
				response = await this.mongoData.test.getByIds(ids);
			}
			catch (error) {
				return callback(error);
			}
			this.checkResponse(null, response, callback);
		})();
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

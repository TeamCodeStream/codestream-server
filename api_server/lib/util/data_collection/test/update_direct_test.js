'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class UpdateDirectTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models after they are directly updated';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomModels,	// create a series of random models
			this.persist,				// persist those models to the database
			this.clearCache,			// clear the local cache
			this.updateModels			// update those models using a direct update (bypassing cache)
		], callback);
	}

	// update our test models using a direct update query, which bypasses the cache
	updateModels (callback) {
		// do a direct update to change the text of our test models
		let regexp = new RegExp(`^${this.randomizer}yes$`);
		this.data.test.updateDirect(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} },
			callback
		);
	}

	// run the test...
	run (callback) {
		// query the database directly for our test models
		let ids = this.models.map(model => { return model.id; });
		this.mongoData.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	// validate the response
	validateResponse () {
		// check that our test models have the update, and the other models don't
		Assert(this.response instanceof Array, 'response must be an array');
		Assert(this.response.length === this.models.length);
		this.response.forEach(responseObject => {
			if (this.wantN(responseObject.number)) {
				Assert(responseObject.text === 'goodbye', `expected model ${responseObject._id} wasn't updated`);
			}
			else {
				Assert(responseObject.text === 'hello' + responseObject.number, `model ${responseObject._id} seems to have been improperly updated`);
			}
		});
	}
}

module.exports = UpdateDirectTest;

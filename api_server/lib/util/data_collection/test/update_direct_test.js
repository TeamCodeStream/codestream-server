'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class UpdateDirectTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models after they are directly updated';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomModels,
			this.persist,
			this.clearCache,
			this.updateModels
		], callback);
	}

	updateModels (callback) {
		let regexp = new RegExp(`^${this.randomizer}yes$`);
		this.data.test.updateDirect(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} },
			callback
		);
	}

	run (callback) {
		let ids = this.models.map(model => { return model.id; });
		this.mongoData.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
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

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetOneByQueryTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting one model by query';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomModels,
			this.persist,
			this.clearCache
		], callback);
	}

	run (callback) {
		this.testModel = this.models[4];
		this.data.test.getOneByQuery(
			{
				text: this.testModel.get('text'),
				flag: this.testModel.get('flag')
			},
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = GetOneByQueryTest;

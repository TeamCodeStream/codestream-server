'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class UpdateToDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after updating a model and persisting';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestModel,
			this.persist,
			this.clearCache,
			this.updateTestModel,
			this.persist
		], callback);
	}

	run (callback) {
		this.mongoData.test.getById(
			this.testModel.id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateObjectResponse();
	}
}

module.exports = UpdateToDatabaseTest;

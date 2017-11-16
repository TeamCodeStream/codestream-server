'use strict';

var DataCollectionTest = require('./data_collection_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class CreateAndPersistTest extends DataCollectionTest {

	get description () {
		return 'should create a model that can then be fetched from the database by its ID after it is persisted';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestAndControlModel,
			this.persist,
			this.clearCache
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

module.exports = CreateAndPersistTest;

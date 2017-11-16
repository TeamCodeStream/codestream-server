'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class GetByQueryTest extends MongoTest {

	get description () {
		return 'should get the correct documents when getting several documents by query';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomDocuments,
			this.filterTestDocuments
		], callback);
	}

	run (callback) {
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByQueryTest;

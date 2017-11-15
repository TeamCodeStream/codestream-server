'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class GetByIdsTest extends MongoTest {

	get description () {
		return 'should get the correct documents when getting several documents by ID';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomDocuments,
			this.filterTestDocuments
		], callback);
	}

	run (callback) {
		let ids = this.testDocuments.map(document => { return document._id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsTest;

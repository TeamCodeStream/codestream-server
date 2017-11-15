'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class DeleteByQueryTest extends MongoTest {

	get description () {
		return 'should not get documents after they have been deleted by query';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomDocuments,
			this.filterTestDocuments,
			this.deleteDocuments
		], callback);
	}

	deleteDocuments (callback) {
		this.data.test.deleteByQuery(
			{ flag: this.randomizer + 'no' },
			callback
		);
	}

	run (callback) {
		let ids = this.documents.map(document => { return document._id; });
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

module.exports = DeleteByQueryTest;

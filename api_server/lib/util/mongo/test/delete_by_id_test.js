'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');

class DeleteByIdTest extends MongoTest {

	get description () {
		return 'should not get a document after it has been deleted';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestAndControlDocument,
			this.deleteDocument
		], callback);
	}

	deleteDocument (callback) {
		this.data.test.deleteById(
			this.testDocument._id,
			callback
		);
	}

	run (callback) {
		this.testDocuments = [this.controlDocument];
		this.data.test.getByIds(
			[this.testDocument._id, this.controlDocument._id],
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = DeleteByIdTest;

'use strict';

var MongoTest = require('./mongo_test');
var Assert = require('assert');

class GetByIdNotFoundTest extends MongoTest {

	get description () {
		return 'should get null when getting document that does not exist';
	}

	run (callback) {
		let nextId = this.data.test.createId();
		this.data.test.getById(
			nextId,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		Assert(this.response === null, 'response must be null');
	}
}

module.exports = GetByIdNotFoundTest;

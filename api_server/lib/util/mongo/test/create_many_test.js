'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');
var Assert = require('assert');

class CreateManyTest extends MongoTest {

	get description () {
		return 'should create several documents that can then be fetched by ID';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.prepareDocuments,
			this.createDocuments
		], callback);
	}

	prepareDocuments (callback) {
		this.documents = new Array(5);
		BoundAsync.times(
			this,
			5,
			this.prepareOneDocument,
			callback
		);
	}

	prepareOneDocument (n, callback) {
		this.documents[n] = {
			text: 'hello' + n,
			number: 10000 + n
		};
		callback();
	}

	createDocuments (callback) {
		this.data.test.createMany(
			this.documents,
			(error, documents) => {
				if (error) { return callback(error); }
				this.testDocuments = documents;
				callback();
			}
		);
	}

	run (callback) {
		this.testDocuments.sort((a, b) => {
			return a.number - b.number;
		});
		let ids = this.testDocuments.map(document => { return document._id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(this.testDocuments, this.response, 'fetched documents don\'t match');
	}
}

module.exports = CreateManyTest;

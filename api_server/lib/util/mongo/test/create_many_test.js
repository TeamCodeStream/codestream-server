'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');
var Assert = require('assert');

class CreateManyTest extends MongoTest {

	get description () {
		return 'should create several documents that can then be fetched by ID';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up mongo client
			this.prepareDocuments,	// prepare the document data
			this.createDocuments	// create the documents
		], callback);
	}

	// prepare a set of documents
	prepareDocuments (callback) {
		this.documents = new Array(5);
		BoundAsync.times(
			this,
			5,
			this.prepareOneDocument,
			callback
		);
	}

	// prepare a single document with some data to write
	prepareOneDocument (n, callback) {
		this.documents[n] = {
			text: 'hello' + n,
			number: 10000 + n
		};
		callback();
	}

	// create our prepared documents in the database
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

	// run the test...
	run (callback) {
		// sort the documents to avoid ambiguous order in the comparison
		this.testDocuments.sort((a, b) => {
			return a.number - b.number;
		});
		// get the documents that should have been created, by ID, and verify we got them
		let ids = this.testDocuments.map(document => { return document._id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	// validate we got the documents we expected
	validateResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		// sort to avoid ambiguity in the comparison
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(this.testDocuments, this.response, 'fetched documents don\'t match');
	}
}

module.exports = CreateManyTest;

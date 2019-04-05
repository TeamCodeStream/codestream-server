'use strict';

const MongoTest = require('./mongo_test');
const Assert = require('assert');

class CreateManyTest extends MongoTest {

	get description () {
		return 'should create several documents that can then be fetched by ID';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				this.prepareDocuments();	// prepare the document data
				await this.createDocuments();	// create the documents
			}
			catch (error) {
				return callback(error);
			}
			callback();
		});
	}

	// prepare a set of documents
	prepareDocuments () {
		this.documents = [];
		for (let n = 0; n < 5; n++) {
			this.documents.push({
				text: 'hello' + n,
				number: 10000 + n
			});
		}
	}

	// create our prepared documents in the database
	async createDocuments () {
		this.testDocuments = await this.data.test.createMany(this.documents);
	}

	// run the test...
	run (callback) {
		(async () => {
			// sort the documents to avoid ambiguous order in the comparison
			this.testDocuments.sort((a, b) => {
				return a.number - b.number;
			});
			// get the documents that should have been created, by ID, and verify we got them
			const ids = this.testDocuments.map(document => { return document.id; });
			let response;
			try {
				response = await this.data.test.getByIds(ids);
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
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

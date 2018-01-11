// base class for all MongoCollection tests, we'll set up the mongo client here, plus provide a bunch
// of utility functions that other tests can share and run

'use strict';

var GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var MongoClient = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client.js');
var TestAPIConfig = require(process.env.CS_API_TOP + '/config/api_test');
var RandomString = require('randomstring');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');

class MongoTest extends GenericTest {

	// before the test runs...
	before (callback) {
		// set up the mongo client, and open it against a test collection
		this.mongoClientFactory = new MongoClient();
		const mongoConfig = Object.assign({}, TestAPIConfig.mongo, { collections: ['test'] });
		this.mongoClientFactory.openMongoClient(
			mongoConfig,
			(error, mongoClient) => {
				if (error) { return callback(error); }
				this.mongoClient = mongoClient;
				this.data = this.mongoClient.mongoCollections;
				callback();
			}
		);
	}

	// create a test document which we'll manipulate and a control document which we won't touch
	createTestAndControlDocument (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestDocument,
			this.createControlDocument
		], callback);
	}

	// create a simple test document with a variety of attributes to be used in various derived tests
	createTestDocument (callback) {
		this.testDocument = {
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5],
			object: {
				x: 1,
				y: 2.1,
				z: 'three'
			}
		};
		this.data.test.create(
			this.testDocument,
			(error, createdDocument) => {
				if (error) { return callback(error); }
				this.testDocument._id = createdDocument._id;
				callback();
			}
		);
	}

	// create a simple control document, distinct from the test document, we should never see this document again
	createControlDocument (callback) {
		this.controlDocument = {
			text: 'goodbye',
			number: 54321,
			array: [5, 4, 3, 2, 1],
			object: {
				x: 3,
				y: 2.2,
				z: 'one'
			}
		};
		this.data.test.create(
			this.controlDocument,
			(error, createdDocument) => {
				if (error) { return callback(error); }
				this.controlDocument._id = createdDocument._id;
				callback();
			}
		);
	}

	// create a bunch of random documents
	createRandomDocuments (callback) {
		this.documents = new Array(10);
		// the randomizer ensures we don't pick up data that has been put in the database by other tests
		this.randomizer = RandomString.generate(20);
		BoundAsync.times(
			this,
			10,
			this.createOneRandomDocument,
			callback
		);
	}

	// with random documents, we'll establish that we only want certain ones when
	// retrieving test results
	wantN (n) {
		// every odd-numbered model, plus the sixth one, should be a random enough pattern
		return n % 2 || n === 6;
	}

	// create a single random document, varying depending upon which document we are creating in order
	createOneRandomDocument (n, callback) {
		let flag = this.randomizer + (this.wantN(n) ? 'yes' : 'no');
		this.documents[n] = {
			text: 'hello' + n,
			number: n,
			flag: flag
		};
		this.data.test.create(
			this.documents[n],
			(error, createdDocument) => {
				if (error) { return callback(error); }
				this.documents[n]._id = createdDocument._id;
				callback();
			}
		);
	}

	// filter the test documents down to only the ones we want in our test results
	filterTestDocuments (callback) {
		this.testDocuments = this.documents.filter(document => {
			return this.wantN(document.number);
		});
		// we'll also sort them by their numeric field, to ensure deep comparisons
		// are not thrown off by objects being fetched out of order
		this.testDocuments.sort((a, b) => {
			return a.number - b.number;
		});
		callback();
	}

	// validate that we got back the document that exactly matches the test document
	validateDocumentResponse () {
		Assert.deepEqual(this.testDocument, this.response, 'fetched document doesn\'t match');
	}

	// validate that we got back an array of objects that exactly match the array of test documents
	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		// sort them by their numeric field, to ensure deep comparisons
		// are not thrown off by objects being fetched out of order
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(this.testDocuments, this.response, 'fetched documents don\'t match');
	}
}

module.exports = MongoTest;

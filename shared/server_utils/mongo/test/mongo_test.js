// base class for all MongoCollection tests, we'll set up the mongo client here, plus provide a bunch
// of utility functions that other tests can share and run

'use strict';

const GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
const MongoClient = require('../mongo_client.js');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const RandomString = require('randomstring');
const Assert = require('assert');

class MongoTest extends GenericTest {

	constructor (options) {
		super(options);
		this.expectedVersion = 1;
	}

	// before the test runs...
	before (callback) {
		// set up the mongo client, and open it against a test collection
		this.mongoClientFactory = new MongoClient({ collections: ['test'], mockMode: this.mockMode });

		(async () => {
			try {
				await ApiConfig.loadPreferredConfig();
				this.mongoClient = await this.mongoClientFactory.openMongoClient(ApiConfig.getPreferredConfig().mongo);
			}
			catch (error) {
				return callback(error);
			}
			this.data = this.mongoClient.mongoCollections;
			callback();
		})();
	}

	after (callback) {
		(async () => {
			if (this.mongoClient) {
				await this.mongoClient.close();
			}
			callback();
		})();
	}

	// create a test document which we'll manipulate and a control document which we won't touch
	async createTestAndControlDocument () {
		await this.createTestDocument();
		await this.createControlDocument();
	}

	// create a simple test document with a variety of attributes to be used in various derived tests
	async createTestDocument () {
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
		const createdDocument = await this.data.test.create(this.testDocument);
		this.testDocument.id = createdDocument.id;
	}

	// create a simple control document, distinct from the test document, we should never see this document again
	async createControlDocument () {
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
		const createdDocument = await this.data.test.create(this.controlDocument);
		this.controlDocument.id = createdDocument.id;
	}

	// create a bunch of random documents
	async createRandomDocuments () {
		this.documents = new Array(10);
		// the randomizer ensures we don't pick up data that has been put in the database by other tests
		this.randomizer = RandomString.generate(20);
		for (let n = 0; n < 10; n++) {
			await this.createOneRandomDocument(n);
		}
	}

	// with random documents, we'll establish that we only want certain ones when
	// retrieving test results
	wantN (n) {
		// every odd-numbered model, plus the sixth one, should be a random enough pattern
		return n % 2 || n === 6;
	}

	// create a single random document, varying depending upon which document we are creating in order
	async createOneRandomDocument (n) {
		let flag = this.randomizer + (this.wantN(n) ? 'yes' : 'no');
		this.documents[n] = {
			text: 'hello' + n,
			number: n,
			flag: flag
		};
		const createdDocument = await this.data.test.create(this.documents[n]);
		this.documents[n].id = createdDocument.id;
	}

	// filter the test documents down to only the ones we want in our test results
	async filterTestDocuments () {
		this.testDocuments = this.documents.filter(document => {
			return this.wantN(document.number);
		});
		// we'll also sort them by their numeric field, to ensure deep comparisons
		// are not thrown off by objects being fetched out of order
		this.testDocuments.sort((a, b) => {
			return a.number - b.number;
		});
	}

	// validate that we got back the document that exactly matches the test document
	validateDocumentResponse () {
		if (this.expectedVersion) {
			Assert.equal(this.testDocument.version, this.expectedVersion, 'version not correct');
		}
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

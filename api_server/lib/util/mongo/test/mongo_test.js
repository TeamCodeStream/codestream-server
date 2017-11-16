'use strict';

var GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var MongoClient = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client.js');
var TestAPIConfig = require(process.env.CS_API_TOP + '/config/api_test');
var RandomString = require('randomstring');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class MongoTest extends GenericTest {

	before (callback) {
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

	createTestAndControlDocument (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestDocument,
			this.createControlDocument
		], callback);
	}

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

	createRandomDocuments (callback) {
		this.documents = new Array(10);
		this.randomizer = RandomString.generate(20);
		BoundAsync.times(
			this,
			10,
			this.createOneRandomDocument,
			callback
		);
	}

	wantN (n) {
		return n % 2 || n === 6;
	}

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

	filterTestDocuments (callback) {
		this.testDocuments = this.documents.filter(document => {
			return this.wantN(document.number);
		});
		this.testDocuments.sort((a, b) => {
			return a.number - b.number;
		});
		callback();
	}

	validateDocumentResponse () {
		Assert.deepEqual(this.testDocument, this.response, 'fetched document doesn\'t match');
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(this.testDocuments, this.response, 'fetched documents don\'t match');
	}
}

module.exports = MongoTest;

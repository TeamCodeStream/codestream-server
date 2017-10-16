'use strict';

var Generic_Test = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var Mongo_Client = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client.js');
var Test_API_Config = require(process.env.CS_API_TOP + '/config/api_test');
var Random_String = require('randomstring');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class Mongo_Test extends Generic_Test {

	before (callback) {
		this.mongo_client_factory = new Mongo_Client();
		const mongo_config = Object.assign({}, Test_API_Config.mongo, { collections: ['test'] });
		this.mongo_client_factory.open_mongo_client(
			mongo_config,
			(error, mongo_client) => {
				if (error) { return callback(error); }
				this.mongo_client = mongo_client;
				this.data = this.mongo_client.mongo_collections;
				callback();
			}
		);
	}

	create_test_and_control_document (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_document,
			this.create_control_document
		], callback);
	}

	create_test_document (callback) {
		this.test_document = {
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
			this.test_document,
			(error, created_document) => {
				if (error) { return callback(error); }
				this.test_document._id = created_document._id;
				callback();
			}
		);
	}

	create_control_document (callback) {
		this.control_document = {
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
			this.control_document,
			(error, created_document) => {
				if (error) { return callback(error); }
				this.control_document._id = created_document._id;
				callback();
			}
		);
	}

	create_random_documents (callback) {
		this.documents = new Array(10);
		this.randomizer = Random_String.generate(20);
		Bound_Async.times(
			this,
			10,
			this.create_one_random_document,
			callback
		);
	}

	want_n (n) {
		return n % 2 || n === 6;
	}

	create_one_random_document (n, callback) {
		let flag = this.randomizer + (this.want_n(n) ? 'yes' : 'no');
		this.documents[n] = {
			text: 'hello' + n,
			number: n,
			flag: flag
		};
		this.data.test.create(
			this.documents[n],
			(error, created_document) => {
				if (error) { return callback(error); }
				this.documents[n]._id = created_document._id;
				callback();
			}
		);
	}

	filter_test_documents (callback) {
		this.test_documents = this.documents.filter(document => {
			return this.want_n(document.number);
		});
		this.test_documents.sort((a, b) => {
			return a.number - b.number;
		});
		callback();
	}

	validate_document_response () {
		Assert.deepEqual(this.response, this.test_document, 'fetched document doesn\'t match');
	}

	validate_array_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(this.response, this.test_documents, 'fetched documents don\'t match');
	}
}

module.exports = Mongo_Test;

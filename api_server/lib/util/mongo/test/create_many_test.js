'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');
var Assert = require('assert');

class Create_Many_Test extends Mongo_Test {

	get description () {
		return 'should create several documents that can then be fetched by ID';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.prepare_documents,
			this.create_documents
		], callback);
	}

	prepare_documents (callback) {
		this.documents = new Array(5);
		Bound_Async.times(
			this,
			5,
			this.prepare_one_document,
			callback
		);
	}

	prepare_one_document (n, callback) {
		this.documents[n] = {
			text: 'hello' + n,
			number: 10000 + n
		};
		callback();
	}

	create_documents (callback) {
		this.data.test.create_many(
			this.documents,
			(error, documents) => {
				if (error) { return callback(error); }
				this.test_documents = documents;
				callback();
			}
		);
	}

	run (callback) {
		this.test_documents.sort((a, b) => {
			return a.number - b.number;
		});
		let ids = this.test_documents.map(document => { return document._id; });
		this.data.test.get_by_ids(
			ids,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(this.test_documents, this.response, 'fetched documents don\'t match');
	}
}

module.exports = Create_Many_Test;

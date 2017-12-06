'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdFromDatabaseTest = require('./get_by_id_from_database_test');
var Assert = require('assert');

class FindAndModifyTest extends GetByIdFromDatabaseTest {

	get description () {
		return 'should get the original document, and then the modified document, when performing a find-and-modify operation';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	run (callback) {
		BoundAsync.series(this, [
			this.checkFetchedDocument,
			super.run
		], callback);
	}

	updateDocument (callback) {
		const update = {
			number: 5
		};
		this.data.test.findAndModify(
			{ _id: this.data.test.objectIdSafe(this.testModel.id) },
			{ '$inc': update },
			(error, document) => {
				if (error) { return callback(error); }
				this.fetchedDocument = document;
				callback();
			}
		);
	}

	checkFetchedDocument (callback) {
		Assert.deepEqual(this.testModel.attributes, this.fetchedDocument, 'fetched document not equal to test model attributes');
		this.testModel.attributes.number += 5;
		callback();
	}
}

module.exports = FindAndModifyTest;

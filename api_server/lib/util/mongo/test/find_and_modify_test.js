'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var GetByIdTest = require('./get_by_id_test');
var Assert = require('assert');

class FindAndModifyTest extends GetByIdTest {

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
			{ _id: this.data.test.objectIdSafe(this.testDocument._id) },
			{ '$inc': update },
			(error, result) => {
				if (error) { return callback(error); }
				this.fetchedDocument = result.value;
				callback();
			}
		);
	}

	checkFetchedDocument (callback) {
		this.fetchedDocument._id = this.fetchedDocument._id.toString();
		Assert.deepEqual(this.testDocument, this.fetchedDocument, 'fetched document not equal to test document');
		this.testDocument.number += 5;
		callback();
	}
}

module.exports = FindAndModifyTest;

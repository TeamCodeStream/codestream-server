'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var UpdateTest = require('./update_test');
var Assert = require('assert');

class FindAndModifyTest extends UpdateTest {

	get description () {
		return 'should get the original document, and then the modified document, when performing a find-and-modify operation';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			this.checkFetchedDocument,	// check that we got the unmodified document as a result of the operation
			super.run					// do the normal check for UpdateTest, checking against the updated test document
		], callback);
	}

	updateDocument (callback) {
		// run the findAndModify, which will update the document in the database, but return the document
		// before the update
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
		// check that the fetched document matches the document before the update, but then prepare for the
		// document to be checked against the document after the update (in the base class's run method)
		this.fetchedDocument._id = this.fetchedDocument._id.toString();
		Assert.deepEqual(this.testDocument, this.fetchedDocument, 'fetched document not equal to test document');
		this.testDocument.number += 5;
		callback();
	}
}

module.exports = FindAndModifyTest;

'use strict';

const UpdateTest = require('./update_test');
const Assert = require('assert');
const AwaitUtils = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class FindAndModifyTest extends UpdateTest {

	get description () {
		return 'should get the original document, and then the modified document, when performing a find-and-modify operation';
	}

	// run the test...
	async run (callback) {
		try {
			this.checkFetchedDocument();	// check that we got the unmodified document as a result of the operation
			await this.superRun();				// do the normal check for UpdateTest, checking against the updated test document
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	async superRun () {
		await AwaitUtils.callbackWrap(super.run.bind(this));
	}

	async updateDocument () {
		// run the findAndModify, which will update the document in the database, but return the document
		// before the update
		const update = {
			number: 5
		};
		const result = await this.data.test.findAndModify(
			{ _id: this.data.test.objectIdSafe(this.testDocument._id) },
			{ '$inc': update }
		);
		this.fetchedDocument = result.value;
	}

	checkFetchedDocument () {
		// check that the fetched document matches the document before the update, but then prepare for the
		// document to be checked against the document after the update (in the base class's run method)
		this.fetchedDocument.id = this.fetchedDocument._id = this.fetchedDocument._id.toString();
		Assert.deepEqual(this.testDocument, this.fetchedDocument, 'fetched document not equal to test document');
		this.testDocument.number += 5;
	}
}

module.exports = FindAndModifyTest;

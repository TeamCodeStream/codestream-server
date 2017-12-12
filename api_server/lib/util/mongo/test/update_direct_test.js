'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');
var Assert = require('assert');

class UpdateDirectTest extends MongoTest {

	get description () {
		return 'should get the correct documents after they are directly updated';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomDocuments,	// create a series of random documents
			this.updateDocuments		// update those documents using a direct update
		], callback);
	}

	// update the test documents using a direct update operation
	updateDocuments (callback) {
		// do a direct update to change the text of our test documents
		let regexp = new RegExp(`^${this.randomizer}yes$`);
		this.data.test.updateDirect(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} },
			callback
		);
	}

	// run the test...
	run (callback) {
		// fetch our test documents
		let ids = this.documents.map(document => { return document._id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	// validate the response
	validateResponse () {
		// check that our test documents have the update, and the other models don't
		Assert(this.response instanceof Array, 'response must be an array');
		Assert(this.response.length === this.documents.length);
		this.response.forEach(responseDocument => {
			if (this.wantN(responseDocument.number)) {
				Assert(responseDocument.text === 'goodbye', `expected document ${responseDocument._id} wasn't updated`);
			}
			else {
				Assert(responseDocument.text === 'hello' + responseDocument.number, `document ${responseDocument._id} seems to have been improperly updated`);
			}
		});
	}
}

module.exports = UpdateDirectTest;

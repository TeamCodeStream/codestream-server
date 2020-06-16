'use strict';

const MongoTest = require('./mongo_test');
const Assert = require('assert');

class UpdateDirectTest extends MongoTest {

	get description () {
		return 'should get the correct documents after they are directly updated';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				await this.createRandomDocuments();	// create a series of random documents
				await this.updateDocuments();			// update those documents using a direct update
			}
			catch (error) {
				return callback(error);
			}
			callback();
		});
	}

	// update the test documents using a direct update operation
	async updateDocuments () {
		// do a direct update to change the text of our test documents
		const regexp = new RegExp(`^${this.randomizer}yes$`);
		await this.data.test.updateDirect(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} }
		);
	}

	// run the test...
	run (callback) {
		(async () => {
			// fetch our test documents
			const ids = this.documents.map(document => { return document.id; });
			let response;
			try {
				response = await this.data.test.getByIds(ids);
			}
			catch (error) {
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}

	// validate the response
	validateResponse () {
		// check that our test documents have the update, and the other models don't
		Assert(this.response instanceof Array, 'response must be an array');
		Assert(this.response.length === this.documents.length);
		this.response.forEach(responseDocument => {
			if (this.wantN(responseDocument.number)) {
				Assert(responseDocument.text === 'goodbye', `expected document ${responseDocument.id} wasn't updated`);
			}
			else {
				Assert(responseDocument.text === 'hello' + responseDocument.number, `document ${responseDocument.id} seems to have been improperly updated`);
			}
		});
	}
}

module.exports = UpdateDirectTest;

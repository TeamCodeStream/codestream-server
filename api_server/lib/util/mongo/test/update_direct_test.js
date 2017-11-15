'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');
var Assert = require('assert');

class UpdateDirectTest extends MongoTest {

	get description () {
		return 'should get the correct documents after they are directly updated';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomDocuments,
			this.updateDocuments
		], callback);
	}

	updateDocuments (callback) {
		let regexp = new RegExp(`^${this.randomizer}yes$`);
		this.data.test.updateDirect(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} },
			callback
		);
	}

	run (callback) {
		let ids = this.documents.map(document => { return document._id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
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

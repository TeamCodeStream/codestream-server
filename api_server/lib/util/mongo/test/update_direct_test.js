'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');
var Assert = require('assert');

class Update_Direct_Test extends Mongo_Test {

	get description () {
		return 'should get the correct documents after they are directly updated';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_documents,
			this.update_documents
		], callback);
	}

	update_documents (callback) {
		let regexp = new RegExp(`^${this.randomizer}yes$`);
		this.data.test.update_direct(
			{ flag: regexp },
			{ $set: { text: 'goodbye'} },
			callback
		);
	}

	run (callback) {
		let ids = this.documents.map(document => { return document._id; });
		this.data.test.get_by_ids(
			ids,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		Assert(this.response.length === this.documents.length);
		this.response.forEach(response_document => {
			if (this.want_n(response_document.number)) {
				Assert(response_document.text === 'goodbye', `expected document ${response_document._id} wasn't updated`);
			}
			else {
				Assert(response_document.text === 'hello' + response_document.number, `document ${response_document._id} seems to have been improperly updated`);
			}
		});
	}
}

module.exports = Update_Direct_Test;

'use strict';

var UpdateTest = require('./update_test');
var ObjectID = require('mongodb').ObjectID;

class ApplyUpsertOpTest extends UpdateTest {

	get description () {
		return 'should get the correct document after upserting a document by op that did not exist before';
	}

	async updateDocument () {
		// do an update with the upsert option, verify that the test document was created
		const update = {
			_id: ObjectID(),
			text: 'upserted!',
			number: 123
		};
		const result = await this.data.test.applyOpById(
			update._id,
			{ '$set': update },
			{ upsert: true }
		);
		this.testDocument = Object.assign({}, update);
		this.testDocument._id = result.upsertedId._id.toString();
	}
}

module.exports = ApplyUpsertOpTest;

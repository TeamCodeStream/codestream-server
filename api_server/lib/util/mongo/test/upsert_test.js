'use strict';

var GetByIdTest = require('./get_by_id_test');
var ObjectID = require('mongodb').ObjectID;

class UpsertTest extends GetByIdTest {

	get description () {
		return 'should get the correct document after upserting a document that did not exist before';
	}

	// before the test runs...
	async before (callback) {
		try {
			await super.before();
			await this.updateDocument();
		}
		catch (error) {
			callback(error);
		}
		callback();
	}

	async updateDocument () {
		// do an update operation with the upsert option, this should create the document even though
		// it did not exist before
		const update = {
			_id: ObjectID(),	// generate a new ID for it
			text: 'upserted!',
			number: 123
		};
		const result = await this.data.test.update(
			update,
			{
				upsert: true
			}
		);
		this.testDocument = Object.assign({}, update);
		this.testDocument._id = result.upsertedId._id.toString();
	}
}

module.exports = UpsertTest;

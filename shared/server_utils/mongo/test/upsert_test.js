'use strict';

const GetByIdTest = require('./get_by_id_test');
const ObjectID = require('mongodb').ObjectID;

class UpsertTest extends GetByIdTest {

	get description () {
		return 'should get the correct document after upserting a document that did not exist before';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				await this.updateDocument();
			}
			catch (error) {
				return callback(error);
			}
			callback();
		});
	}

	async updateDocument () {
		// do an update operation with the upsert option, this should create the document even though
		// it did not exist before
		const id = ObjectID();	// generate a new ID for it
		const update = {
			id: id,
			text: 'upserted!',
			number: 123
		};
		this.expectedOp = {
			$set: Object.assign({}, update)
		};
		delete this.expectedOp.$set.id;
		this.actualOp = await this.data.test.update(
			update,
			{
				upsert: true
			}
		);
		this.testDocument = Object.assign({}, update);
		this.testDocument.id = id.toString();
		this.testDocument._id = this.testDocument.id;	// DEPRECATE ME
		delete this.expectedVersion;
	}
}

module.exports = UpsertTest;

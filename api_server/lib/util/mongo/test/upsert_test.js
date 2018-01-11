'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var GetByIdTest = require('./get_by_id_test');
var ObjectID = require('mongodb').ObjectID;

class UpsertTest extends GetByIdTest {

	get description () {
		return 'should get the correct document after upserting a document that did not exist before';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateDocument
		], callback);
	}

	updateDocument (callback) {
		// do an update operation with the upsert option, this should create the document even though
		// it did not exist before
		const update = {
			_id: ObjectID(),	// generate a new ID for it
			text: 'upserted!',
			number: 123
		};
		this.data.test.update(
			update,
			(error, result) => {
				if (error) { return callback(error); }
				this.testDocument = Object.assign({}, update);
				this.testDocument._id = result.upsertedId._id.toString();
				callback();
			},
			{
				upsert: true
			}
		);
	}
}

module.exports = UpsertTest;

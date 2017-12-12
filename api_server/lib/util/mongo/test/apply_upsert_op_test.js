'use strict';

var UpdateTest = require('./update_test');
var ObjectID = require('mongodb').ObjectID;

class ApplyUpsertOpTest extends UpdateTest {

	get description () {
		return 'should get the correct document after upserting a document by op that did not exist before';
	}

	updateDocument (callback) {
		// do an update with the upsert option, verify that the test document was created
		const update = {
			_id: ObjectID(),
			text: 'upserted!',
			number: 123
		};
		this.data.test.applyOpById(
			update._id,
			{ '$set': update },
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

module.exports = ApplyUpsertOpTest;

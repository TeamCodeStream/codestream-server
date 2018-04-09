'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class UpdateNoIdTest extends DataCollectionTest {

	get description () {
		return 'should return an error when attempting to update a model with no ID';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up mongo client
			this.createTestModel	// create a test model
		], callback);
	}

	async run (callback) {
		// to do an update operation, the caller must supply an ID, either in the options,
		// or in the update itself ... if there is no ID, we should get back an error
		const update = {
			text: 'replaced!',
			number: 123
		};
		try {
			await this.data.test.update(update);
		}
		catch (error) {
			const errorCode = 'DTCL-1000';
			Assert(typeof error === 'object' && error.code && error.code === errorCode, `error code ${errorCode} expected`);
			return callback();
		}
		Assert.fail('error expected');
	}
}

module.exports = UpdateNoIdTest;

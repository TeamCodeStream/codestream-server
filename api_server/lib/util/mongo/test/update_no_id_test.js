'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoTest = require('./mongo_test');
var Assert = require('assert');

class UpdateNoIdTest extends MongoTest {

	get description () {
		return 'should return an error when attempting to update a document with no ID';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up mongo client
			this.createTestDocument // create a test document
		], callback);
	}

	run (callback) {
		// to do an update operation, the caller must supply an ID, either in the options,
		// or in the update itself ... if there is no ID, we should get back an error
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				const errorCode = 'MDTA-1001';
				Assert(typeof error === 'object' && error.code && error.code === errorCode, `error code ${errorCode} expected`);
				callback();
			}
		);
	}
}

module.exports = UpdateNoIdTest;

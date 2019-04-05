'use strict';

const MongoTest = require('./mongo_test');
const Assert = require('assert');

class UpdateNoIdTest extends MongoTest {

	get description () {
		return 'should return an error when attempting to update a document with no ID';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				await this.createTestDocument(); // create a test document
			}
			catch (error) {
				return callback(error);
			}
			callback();
		});
	}

	run (callback) {
		(async () => {
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
				const errorCode = 'MDTA-1001';
				Assert(typeof error === 'object' && error.code && error.code === errorCode, `error code ${errorCode} expected`);
				return callback();
			}
			callback('error not thrown');
		})();
	}
}

module.exports = UpdateNoIdTest;

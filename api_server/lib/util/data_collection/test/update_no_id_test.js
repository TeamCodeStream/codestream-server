'use strict';

const DataCollectionTest = require('./data_collection_test');
const Assert = require('assert');

class UpdateNoIdTest extends DataCollectionTest {

	get description () {
		return 'should return an error when attempting to update a model with no ID';
	}

	async before () {
		await super.before();			// set up mongo client
		await this.createTestModel();	// create a test model
	}

	async run () {
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
			return;
		}
		Assert.fail('error expected');
	}
}

module.exports = UpdateNoIdTest;

'use strict';

const UpdateTest = require('./update_test');

class ApplyUpsertOpTest extends UpdateTest {

	get description () {
		return 'should get the correct document after upserting a document by op that did not exist before';
	}

	async updateDocument () {
		// do an update with the upsert option, verify that the test document was created
		const update = {
			text: 'upserted!',
			number: 123
		};
		this.expectedOp = {
			'$set': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp,
			{ upsert: true }
		);
		Object.assign(this.testDocument, update);
	}
}

module.exports = ApplyUpsertOpTest;

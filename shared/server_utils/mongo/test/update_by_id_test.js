'use strict';

const GetByIdTest = require('./get_by_id_test');

class UpdateByIdTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after updating a document by ID';
	}

	// before the test runs...
	async before (callback) {
		try {
			await super.before();			// set up mongo client and create a test document
			await this.updateDocument();	// update the document
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	async updateDocument () {
		// update the document and verify the update took
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = { 
			$set: update
		};
		this.actualOp = await this.data.test.updateById(
			this.testDocument._id,
			update
		);
		Object.assign(this.testDocument, update);
	}
}

module.exports = UpdateByIdTest;

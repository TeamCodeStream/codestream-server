'use strict';

var GetByIdTest = require('./get_by_id_test');

class UpdateTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after updating a document';
	}

	// before the test runs...
	async before (callback) {
		try {
			await super.before();			// set up mongo client and create a test document
			await this.updateDocument();	// update the test document
		}
		catch (error) {
			if (callback) {
				callback(error);
			}
			else {
				throw error;
			}
		}
		if (callback) {
			callback();
		}
	}

	async updateDocument () {
		// do the update and verify that it took
		const update = {
			_id: this.testDocument._id,
			text: 'replaced!',
			number: 123
		};
		await this.data.test.update(update);
		Object.assign(this.testDocument, update);
	}
}

module.exports = UpdateTest;

'use strict';

const GetByIdTest = require('./get_by_id_test');

class UpdateTest extends GetByIdTest {

	get description () {
		return 'should get the correctly updated document after updating a document';
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			try {
				await this.updateDocument();	// update the test document
			}
			catch (error) {
				return callback(error);
			}
			callback();
		});
	}

	async updateDocument () {
		// do the update and verify that it took
		const update = {
			id: this.testDocument.id,
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = {
			$set: Object.assign({}, update)
		};
		delete this.expectedOp.$set.id;
		this.actualOp = await this.data.test.update(update);
		Object.assign(this.testDocument, update);
	}
}

module.exports = UpdateTest;

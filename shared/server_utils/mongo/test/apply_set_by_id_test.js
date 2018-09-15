'use strict';

var UpdateTest = require('./update_test');

class ApplySetByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a set operation to a document';
	}

	async updateDocument () {
		// do an update with a $set operation, verify that it took
		const update = {
			text: 'replaced!',
			number: 123
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$set': update }
		);
		Object.assign(this.testDocument, update);
	}
}

module.exports = ApplySetByIdTest;

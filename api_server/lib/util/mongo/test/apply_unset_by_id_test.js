'use strict';

var UpdateTest = require('./update_test');

class ApplyUnsetByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an unset operation to a document';
	}

	async updateDocument () {
		// unset (delete an attribute), verify that it took
		const update = {
			text: 1,
		};
		await this.data.test.applyOpById(
			this.testDocument._id,
			{ '$unset': update }
		);
		delete this.testDocument.text;
	}
}

module.exports = ApplyUnsetByIdTest;

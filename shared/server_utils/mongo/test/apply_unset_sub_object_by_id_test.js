'use strict';

const UpdateTest = require('./update_test');

class ApplyUnsetSubObjectByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an unset operation to a sub-object of a document';
	}

	async updateDocument () {
		// unset (delete) an attribute of an object in the document, verify that it took
		const update = {
			'object.y': 1,
		};
		this.expectedOp = {
			'$unset': update
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
		delete this.testDocument.object.y;
	}
}

module.exports = ApplyUnsetSubObjectByIdTest;

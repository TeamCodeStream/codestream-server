'use strict';

var UpdateTest = require('./update_test');

class ApplyNoAddByIdTest extends UpdateTest {

	get description () {
		return 'should get an unchanged document after applying a no-op add operation to a document';
	}

	updateDocument (callback) {
		// try to add an element to an array that is already in the array, the document should be unchanged
		const update = {
			array: 4
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$addToSet': update },
			callback
		);
	}
}

module.exports = ApplyNoAddByIdTest;

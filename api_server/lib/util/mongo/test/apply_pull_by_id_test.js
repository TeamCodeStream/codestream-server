'use strict';

var UpdateTest = require('./update_test');

class ApplyPullByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a pull operation to a document';
	}

	updateDocument (callback) {
		// pull an element from the array, verify that it was pulled
		const update = {
			array: 4
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$pull': update },
			(error) => {
				if (error) { return callback(error); }
				let index = this.testDocument.array.indexOf(4);
				this.testDocument.array.splice(index, 1);
				callback();
			}
		);
	}
}

module.exports = ApplyPullByIdTest;

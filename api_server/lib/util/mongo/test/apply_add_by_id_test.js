'use strict';

var UpdateTest = require('./update_test');

class ApplyAddByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an add operation to a document';
	}

	updateDocument (callback) {
		// add an element to the array, make sure it gets added
		const update = {
			array: 7
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$addToSet': update },
			(error) => {
				if (error) { return callback(error); }
				this.testDocument.array.push(7);
				callback();
			}
		);
	}
}

module.exports = ApplyAddByIdTest;

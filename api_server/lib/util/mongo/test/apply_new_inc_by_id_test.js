'use strict';

var UpdateTest = require('./update_test');

class ApplyNewIncByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an increment operation to a document when the field does not yet exist';
	}

	updateDocument (callback) {
		// do an increment on a field which doesn't exist, should act like the field was 0 and create it
		// with the increment applied
		const update = {
			newNumber: 5
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$inc': update },
			(error) => {
				if (error) { return callback(error); }
				this.testDocument.newNumber = 5;
				callback();
			}
		);
	}
}

module.exports = ApplyNewIncByIdTest;

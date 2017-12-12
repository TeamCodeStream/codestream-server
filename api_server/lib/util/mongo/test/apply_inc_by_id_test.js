'use strict';

var UpdateTest = require('./update_test');

class ApplyIncByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an increment operation to a document';
	}

	updateDocument (callback) {
		// increment a numeric field, make sure it gets incremented
		const update = {
			number: 5
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$inc': update },
			(error) => {
				if (error) { return callback(error); }
				this.testDocument.number += 5;
				callback();
			}
		);
	}
}

module.exports = ApplyIncByIdTest;

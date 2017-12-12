'use strict';

var UpdateTest = require('./update_test');

class ApplySetByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a set operation to a document';
	}

	updateDocument (callback) {
		// do an update with a $set operation, verify that it took
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$set': update },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testDocument, update);
				callback();
			}
		);
	}
}

module.exports = ApplySetByIdTest;

'use strict';

var UpdateTest = require('./update_test');

class ApplyPushByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a push operation to a document';
	}

	updateDocument (callback) {
		// push an element onto an array, verify it was pushed
		const update = {
			array: 7
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$push': update },
			(error) => {
				if (error) { return callback(error); }
				this.testDocument.array.push(7);
				callback();
			}
		);
	}
}

module.exports = ApplyPushByIdTest;

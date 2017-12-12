'use strict';

var UpdateTest = require('./update_test');

class ApplyUnsetByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an unset operation to a document';
	}

	updateDocument (callback) {
		// unset (delete an attribute), verify that it took
		const update = {
			text: 1,
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$unset': update },
			(error) => {
				if (error) { return callback(error); }
				delete this.testDocument.text;
				callback();
			}
		);
	}
}

module.exports = ApplyUnsetByIdTest;

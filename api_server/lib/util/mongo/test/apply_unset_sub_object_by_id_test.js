'use strict';

var UpdateTest = require('./update_test');

class ApplyUnsetSubObjectByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying an unset operation to a sub-object of a document';
	}

	updateDocument (callback) {
		// unset (delete) an attribute of an object in the document, verify that it took
		const update = {
			'object.y': 1,
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$unset': update },
			(error) => {
				if (error) { return callback(error); }
				delete this.testDocument.object.y;
				callback();
			}
		);
	}
}

module.exports = ApplyUnsetSubObjectByIdTest;

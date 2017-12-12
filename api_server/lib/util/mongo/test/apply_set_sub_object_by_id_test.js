'use strict';

var UpdateTest = require('./update_test');

class ApplySetSubObjectByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a set operation to a sub-object of a document';
	}

	updateDocument (callback) {
		// do a set operation on some attributes of an object, verify the changes took
		const update = {
			'object.x': 'replaced!',
			'object.z': 3
		};
		this.data.test.applyOpById(
			this.testDocument._id,
			{ '$set': update },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testDocument.object, { x: 'replaced!', z: 3 });
				callback();
			}
		);
	}
}

module.exports = ApplySetSubObjectByIdTest;

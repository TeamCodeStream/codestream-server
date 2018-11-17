'use strict';

const UpdateTest = require('./update_test');

class ApplySetSubObjectByIdTest extends UpdateTest {

	get description () {
		return 'should get the correctly updated document after applying a set operation to a sub-object of a document';
	}

	async updateDocument () {
		// do a set operation on some attributes of an object, verify the changes took
		const update = {
			'object.x': 'replaced!',
			'object.z': 3
		};
		this.expectedOp = {
			'$set': update	
		};
		this.actualOp = await this.data.test.applyOpById(
			this.testDocument.id,
			this.expectedOp
		);
		Object.assign(this.testDocument.object, { x: 'replaced!', z: 3 });
	}
}

module.exports = ApplySetSubObjectByIdTest;

'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class ApplyUnsetSubObjectToDatabaseTest extends UpdateToDatabaseTest {

	get description () {
		return 'should get the correct model after applying a sub-object unset to a model and persisting';
	}

	updateTestModel (callback) {
		// selectively unset some values in the object, and verify they are unset
		const unset = {
			'object.y': true
		};
		this.expectedOp = {
			'$unset': unset
		};
		
		(async () => {
			try {
				this.actualOp = await this.data.test.applyOpById(
					this.testModel.id,
					this.expectedOp
				);
			}
			catch (error) {
				return callback(error);
			}
			delete this.testModel.attributes.object.y;
			callback();
		})();
	}
}

module.exports = ApplyUnsetSubObjectToDatabaseTest;

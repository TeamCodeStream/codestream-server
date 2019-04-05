'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class VersionUpdateTest extends UpdateToDatabaseTest {

	get description () {
		return 'version should update and version directives should be added when updating a document with a version';
	}

	updateTestModel (callback) {
		// set some values and verify they are set
		const set = {
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = {
			'$set': set
		};

		(async () => {
			try {
				this.actualOp = await this.data.test.applyOpById(
					this.testModel.id,
					this.expectedOp,
					{ version: 1 }
				);
			}
			catch (error) {
				return callback(error);
			}
			Object.assign(this.testModel.attributes, set);
			this.testModel.attributes.version = 2;
			this.expectedOp.$set.version = 2;
			this.expectedOp.$version = {
				before: 1,
				after: 2
			};
			callback();
		})();
	}
}

module.exports = VersionUpdateTest;

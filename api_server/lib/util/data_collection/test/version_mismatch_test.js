'use strict';

var UpdateToDatabaseTest = require('./update_to_database_test');

class VersionMismatchTest extends UpdateToDatabaseTest {

	get description () {
		return 'version should properly update and version directives should be properly added when updating a document with a version, when the version does not match database version';
	}

	async doInterimUpdate () {
		await this.data.test.applyOpById(
			this.testModel.id,
			{ $set: { text: 'interim!' } },
			{ version: 1}
		);
	}

	updateTestModel (callback) {
		(async () => {
			// before the test update, do an interim update to bump the version
			await this.doInterimUpdate();
			await this.data.test.persist();

			// set some values and verify they are set
			const set = {
				text: 'replaced!',
				number: 123
			};
			this.expectedOp = {
				'$set': set
			};
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
			this.testModel.attributes.version = 3;
			this.expectedOp.$set.version = 3;
			this.expectedOp.$version = {
				before: 2,
				after: 3
			};
			callback();
		})();
	}
}

module.exports = VersionMismatchTest;

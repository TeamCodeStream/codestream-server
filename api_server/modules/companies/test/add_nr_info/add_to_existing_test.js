'use strict';

const AddNRInfoTest = require('./add_nr_info_test');

class AddToExistingTest extends AddNRInfoTest {

	get description () {
		return 'should be ok to update New Relic org/account info for a company which already has org/account info';
	}

	setTestData (callback) {
		this.expectedVersion = 3;
		super.setTestData(error => {
			if (error) { return callback(error); }

			// before setting the test data, add some other account IDs and org IDs
			this.savedData = this.data;
			this.data = {
				accountIds: [
					this.codeErrorFactory.randomAccountId(),
					this.codeErrorFactory.randomAccountId()
				],
				orgIds: [
					this.codeErrorFactory.randomOrgId(),
					this.codeErrorFactory.randomOrgId()
				]
			};
			this.expectedCompany.nrAccountIds.push.apply(this.expectedCompany.nrAccountIds, this.data.accountIds);
			this.expectedCompany.nrOrgIds.push.apply(this.expectedCompany.nrOrgIds, this.data.orgIds);
			this.expectedCompany.version = this.expectedData.company.$set.version = 3;
			this.expectedData.company.$version.before = 2;
			this.expectedData.company.$version.after = 3;
			this.addNRInfo(error => {
				if (error) { return callback(error); }
				this.data = this.savedData;
				callback();
			});
		});
	}
}

module.exports = AddToExistingTest;

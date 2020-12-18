'use strict';

const CompanyTestGroupTest = require('./company_test_group_test');

class TooManyKeysTest extends CompanyTestGroupTest {

	get description () {
		return 'should return an error when the there are too many keys provided in a company test group request';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'too many keys'
		};
	}

	// make the data to use in the settings update, and the data we expect to
	// see when we verify
	setTestData (callback) {
		super.setTestData(error => {
			if (error) { return callback(); }
			// establish data that exceeds the limit of how many keys
			// we can provide at one time in an update
			for (let i = 0; i < 200; i++) {
				this.data[`extraTest${i}`] = `${i}`;
			}
			callback();
		});
	}
}

module.exports = TooManyKeysTest;

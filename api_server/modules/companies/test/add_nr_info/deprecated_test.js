'use strict';

const AddNRInfoTest = require('./add_nr_info_test');

class DeprecatedTest extends AddNRInfoTest {

	get description () {
		return 'should return an error indicating endpoint is deprecated when attempting to add NR info for a comapny, as of one-user-per-org';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = DeprecatedTest;

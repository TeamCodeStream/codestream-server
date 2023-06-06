'use strict';

const AddNRInfoTest = require('./add_nr_info_test');
const Assert = require('assert');

class DeprecatedEmptyTest extends AddNRInfoTest {

	get description () {
		return 'should return an empty response because endpoint will be deprecated, when attempting to add NR info for a comapny, as of one-user-per-org';
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'response not empty');
	}
}

module.exports = DeprecatedEmptyTest;

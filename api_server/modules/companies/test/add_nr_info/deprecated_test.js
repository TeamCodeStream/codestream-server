'use strict';

const AddNRInfoTest = require('./add_nr_info_test');

class DeprecatedTest extends AddNRInfoTest {

	// After Unified Identity, the request can throw instead of returning an empty response
	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}
	
	get description () {
		return 'should return an error indicating endpoint is deprecated when attempting to add NR info for a company, as of one-user-per-org';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = DeprecatedTest;

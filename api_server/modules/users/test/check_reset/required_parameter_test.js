'use strict';

const CheckResetTest = require('./check_reset_test');

class RequiredParameterTest extends CheckResetTest {

	get description () {
		return `should return an error when sending a check reset request without providing the ${this.parameter} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// make the query data for the path part of the test request
	makeQueryData () {
		// remove the parameter in question from the query data
		const queryData = super.makeQueryData();
		delete queryData[this.parameter];
		return queryData;
	}
}

module.exports = RequiredParameterTest;

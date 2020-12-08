'use strict';

const TeamLookupTest = require('./team_lookup_test');

class ParameterRequiredTest extends TeamLookupTest {

	get description() {
		return `should return an error when trying to lookup a team by repo without specifying ${this.parameter}`;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	getRequestData() {
		const data = super.getRequestData();
		delete data[this.parameter];
		return data;
	}
}

module.exports = ParameterRequiredTest;

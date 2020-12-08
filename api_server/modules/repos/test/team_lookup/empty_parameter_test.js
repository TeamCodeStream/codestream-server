'use strict';

const TeamLookupTest = require('./team_lookup_test');

class EmptyParameterTest extends TeamLookupTest {

	get description() {
		return `should return an error when trying to lookup a team by repo with empty ${this.parameter}`;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	getRequestData() {
		const data = super.getRequestData();
		data[this.parameter] = '';
		return data;
	}
}

module.exports = EmptyParameterTest;

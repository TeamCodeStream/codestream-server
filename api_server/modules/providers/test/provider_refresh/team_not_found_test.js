'use strict';

const ProviderRefreshTest = require('./provider_refresh_test');
const ObjectId = require('mongodb').ObjectId;

class TeamNotFoundTest extends ProviderRefreshTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when attempting to refresh the token for a provider and an unknown team is specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters.teamId = ObjectId();
		return parameters;
	}
}

module.exports = TeamNotFoundTest;

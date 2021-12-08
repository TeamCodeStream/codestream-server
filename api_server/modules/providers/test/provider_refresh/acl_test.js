'use strict';

const ProviderRefreshTest = require('./provider_refresh_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ACLTest extends ProviderRefreshTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when attempting to refresh the token for a provider but the user is not on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 2;
		callback();
	}

	refreshToken (callback) {
		BoundAsync.series(this, [
			this.makeOtherTeam,
			super.refreshToken
		], callback);
	}	

	makeOtherTeam (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				callback();
			},
			{
				token: this.users[1].accessToken
			}
		);
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters.teamId = this.otherTeam.id;
		return parameters;
	}
}

module.exports = ACLTest;

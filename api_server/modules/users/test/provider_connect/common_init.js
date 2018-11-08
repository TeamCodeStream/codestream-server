// base class for many tests of the "PUT /no-auth/provider-connect" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UUID = require('uuid/v4');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.preCreateTeam,	// pre-create an existing team, as needed
			this.preCreateUser,	// pre-create the user to sign-in, as needed
			this.setData		// set the data to use in the request
		], callback);
	}
	
	// set the data to use in the request
	setData (callback) {
		const mockUserId = this.preExistingConnectedUser ?
			this.preExistingConnectedUser.providerInfo[this.provider].userId :
			null;
		const mockTeamId = this.preExistingTeam ? 
			this.preExistingTeam.providerInfo[this.provider].teamId : 
			null;
		this.data = this.getMockData(mockUserId, mockTeamId);
		this.beforeLogin = Date.now();
		callback();
	}

	// get random mock data to use for the test request
	getMockData (userId, teamId) {
		const mockUserId = userId || `MOCK${RandomString.generate(8)}`;
		const mockTeamId = teamId || `MOCK${RandomString.generate(8)}`;
		return {
			providerInfo: {
				code: `mock-${mockUserId}-${mockTeamId}`,
				redirectUri: 'https://mock'
			},
			signupToken: UUID(),
			_pubnubUuid: this.userFactory.getNextPubnubUuid()
		};
	}

	// pre-create a team that will match the team associated with the provider
	preCreateTeam (callback) {
		if (!this.wantPreExistingTeam) { return callback(); }
		
		// simply do a provider-connect, creating a new user and new team
		const data = this.getMockData();
		this.doProviderConnect(
			data,
			(error, response) => {
				if (error) { return callback(error); }
				this.preExistingTeamCreator = response.user;
				this.preExistingTeam = response.teams[0];
				callback();
			}
		);
	}

	// pre-create a user that will match the user trying to sign-in with the provider
	preCreateUser (callback) {
		if (this.wantPreExistingConnectedUser) {
			this.preCreateConnectedUser(callback);
		}
		else if (this.wantPreExistingUnconnectedUser) {
			this.preCreateUnconnectedUser(callback);
		}
		else {
			callback();
		}
	}

	// pre-create a user that will match the user trying to sign-in with the provider,
	// by virtue of already being connected to the team
	preCreateConnectedUser (callback) {
		const data = this.getMockData(null, this.preExistingTeam.providerInfo[this.provider].teamId);
		this.doProviderConnect(
			data,
			(error, response) => {
				if (error) { return callback(error); }
				this.preExistingConnectedUser = response.user;
				callback();
			}
		);
	}

	// pre-create a user that will match the user trying to sign-in with the provider,
	// by virtue of an email match, meaning they are not showing as connected to the provider yet
	// the pre-created user can be registered or unregistered, and on a team or not
	preCreateUnconnectedUser (callback) {
		BoundAsync.series(this, [
			this.createUser,
			this.createUnconnectedTeamCreator,
			this.createTeam
		], callback);
	}

	// create a registered or unregistered user
	createUser (callback) {
		// create a random user (registered or unregistered, as needed)
		const func = this.preExistingUserIsRegistered ? 'createUser' : 'registerUser';
		const data = this.userFactory.getRandomUserData();
		this.userFactory[func](
			data,
			(error, userData) => {
				if (error) { return callback(error); }
				this.preExistingUnconnectedUser = userData.user;
				callback();
			}
		);
	}

	// create a team creator, who will create a normal CodeStream team, not yet connected
	// to the provider
	createUnconnectedTeamCreator (callback) {
		if (!this.wantPreExistingUnconnectedTeam) {
			return callback();
		}
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.unconnectedTeamCreatorData = response;
				callback();
			}
		);
	}

	// create a normal CodeStream team, not yet connected to the provider
	createTeam (callback) {
		if (!this.wantPreExistingUnconnectedTeam) {
			return callback();
		}
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.preExistingUnconnectedTeam = response.team;
				callback();
			},
			{
				token: this.unconnectedTeamCreatorData.accessToken
			}
		);
	}

	// do a provider-connect request with the data passed in
	doProviderConnect (data, callback, options = {}) {
		Object.assign(options, {
			method: 'put',
			path: `/no-auth/provider-connect/${this.provider}`,
			data: data
		});
		this.doApiRequest(options, callback);
	}
}

module.exports = CommonInit;

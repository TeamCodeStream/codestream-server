'use strict';

const TrackingTest = require('./tracking_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ProviderTrackingTest extends TrackingTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should set Provider to Slack in tracking message when user is invited to a slack team';
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createSlackTeam,
			this.doLogin
		], callback);
	}

	// create a slack-connected team
	createSlackTeam (callback) {
		const providerInfo = {
			code: `mock-${RandomString.generate(8)}-${RandomString.generate(8)}`,
			redirectUri: `mock://${RandomString.generate(8)}`,
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/provider-connect/slack',
				data: {
					providerInfo,
					_pubnubUuid: this.userFactory.getNextPubnubUuid()
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.teams[0];
				this.company = response.companies[0];
				this.data = {
					teamId: this.team.id,
					email: this.userFactory.randomEmail()				
				};
				this.token = response.accessToken;
				this.currentUser = { 
					user: response.user,
					broadcasterToken: response.broadcasterToken
				};
				this.expectedProvider = 'Slack';
				callback();
			}
		);
	}

	validateMessage (data) {
		return super.validateMessage(data);
	}
}

module.exports = ProviderTrackingTest;

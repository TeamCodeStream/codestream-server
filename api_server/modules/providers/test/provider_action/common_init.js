// base class for many tests of the "POSTS /no-auth/provider-action/:provider" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const UUID = require('uuid/v4');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Crypto = require('crypto');

const LINK_TYPES_TO_ACTION = {
	'web': 'Opened on Web',
	'ide': 'Opened in IDE',
	'external': {
		'code': 'Opened Code',
		'issue': 'Opened Issue'
	}
};

class CommonInit {

	init (callback) {
		this.linkType = this.linkType || 'web';
		// get an auth-code and set the token
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.createUser,	// pre-create user and team, with auth for this provider 
			this.setData,		// set the data to use for the test request
			this.prepareData	// once data is set, prepare it for sending in the test request
		], callback);
	}

	// set options for the test
	setTestOptions (callback) {
		// don't create a team or any users, these will be created as part of the initial provider auth
		delete this.teamOptions.creatorIndex;
		this.userOptions.numRegistered = 0;
		if (!this.mockMode) {
			this.apiRequestOptions = this.apiRequestOptions || {};
			this.apiRequestOptions.noJsonInRequest = true;
		}
		callback();
	}

	// pre-create user and team, with auth for this provider
	createUser (callback) {
		this.mockUserId = `MOCK${RandomString.generate(8)}`;
		if (this.dontCreateUser) { return callback(); }

		this.mockTeamId = `MOCK${RandomString.generate(8)}`;
		const data = {
			providerInfo: {
				code: `mock-${this.mockUserId}-${this.mockTeamId}`,
				redirectUri: 'https://mock'
			},
			signupToken: UUID(),
			_pubnubUuid: this.userFactory.getNextPubnubUuid()
		};
		this.doApiRequest(
			{
				method: 'put',
				path: `/no-auth/provider-connect/${this.provider}`,
				data: data
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.teams[0];
				this.company = response.companies[0];
				this.currentUser = response;
				this.user = this.currentUser.user;
				callback();
			}
		);
	}

	// set the data to use in the request
	setData (callback) {
		const actionPayload = {
			teamId: this.team.id,
			linkType: this.linkType
		};
		if (this.externalType) {
			actionPayload.externalType = this.externalType;
			if (this.externalType === 'code') {
				actionPayload.externalProvider = 'github';
			}
			else if (this.externalType === 'issue') {
				actionPayload.externalProvider = 'trello';
			}
		}

		this.data = {
			type: 'block_actions',
			user: {
				id: this.mockUserId
			},
			actions: [{
				action_id: JSON.stringify(actionPayload)
			}],
			api_app_id: this.apiConfig.integrations.slack.appSharingId			
		};

		const properties = {
			distinct_id: this.user ? this.user.id : this.mockUserId,
			'Team ID': this.team.id,
			'Team Name': this.team.name,
			'Company Name': this.company.name,
			'Company ID': this.company.id,
			'Team Size': 1,
			'Team Created Date': new Date(this.team.createdAt).toISOString(),
			'Plan': '14DAYTRIAL',
			'Reporting Group': '',
			Endpoint: 'Slack',
			company: {
				id: this.company.id,
				name: this.company.name,
				created_at: new Date(this.company.createdAt).toISOString(),
				plan: '14DAYTRIAL',
				trialStart_at: new Date(this.company.trialStartDate).toISOString(),
				trialEnd_at: new Date(this.company.trialEndDate).toISOString()
			}
		};
		if (!this.dontCreateUser) {
			Object.assign(properties, {
				'$email': this.user.email,
				name: this.user.fullName,
				'Join Method': 'Created Team',
				'$created': new Date(this.user.registeredAt).toISOString()
			});
		}

		let event = LINK_TYPES_TO_ACTION[this.linkType];
		if (typeof event === 'object') {
			event = event[this.externalType || 'code'];
		}
		if (this.externalType === 'code') {
			properties.Host = 'GitHub';
		}
		else if (this.externalType === 'issue') {
			properties.Service = 'Trello';
		}

		const data = {
			event,
			properties,
			userId: this.user ? this.user.id : this.mockUserId
		};
		this.message = {
			type: 'track',
			data
		};

		callback();
	}

	// once data is set, prepare it for sending in the test request
	// this is because in mock mode, we don't support non-json data, so it needs to
	// be formed in the url encoded data that the server is ready for
	prepareData (callback) {
		const rawData = encodeURIComponent(JSON.stringify(this.data));
		if (this.mockMode) {
			this.data = { payload: rawData };
		}
		else {
			this.data = `payload=${rawData}`;
		}

		// sign the request, simulating slack
		const now = Math.floor(Date.now() / 1000);
		this.rawBody=`payload=${rawData}`;
		const mySignature = 'v0=' +
			Crypto.createHmac('sha256', this.apiConfig.integrations.slack.appSharingSigningSecret)
				.update(`v0:${now}:${this.rawBody}`, 'utf8')
				.digest('hex');
		this.apiRequestOptions = this.apiRequestOptions || {};
		this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
		Object.assign(this.apiRequestOptions.headers, {
			'x-slack-request-timestamp': now,
			'x-slack-signature': mySignature
		});

		callback();
	}
}

module.exports = CommonInit;

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const ProviderTokenTest = require('./provider_token_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TrelloConfig = require(process.env.CS_API_TOP + '/config/trello');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		let description = `user should receive a message with the token data after authenticating with ${this.provider}`;
		if (this.testHost) {
			description += ', enterprise version';
		}
		return description;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// token data is received on their own me-channel
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.requestSentAt = Date.now();
		this.runRequestAsTest = false;
		BoundAsync.series(this, [
			ProviderTokenTest.prototype.setProviderToken.bind(this),
			this.setExpectedMessage
		], callback);
	}

	// set the message we expect to see
	setExpectedMessage (callback) {
		const expectedData = {
			accessToken: this.mockToken
		};
		let expectedTestCallData;
		switch (this.provider) {
		case 'trello':
		case 'youtrack':
			break;
		case 'github':
			expectedTestCallData = this.getExpectedGithubTestCallData();
			break;
		case 'asana':
			expectedTestCallData = this.getExpectedAsanaTestCallData();
			break;
		case 'jira':
			expectedTestCallData = this.getExpectedJiraTestCallData();
			break;
		case 'gitlab':
			expectedTestCallData = this.getExpectedGitlabTestCallData();
			break;
		case 'bitbucket':
			expectedTestCallData = this.getExpectedBitbucketTestCallData();
			break;
		case 'azuredevops':
			expectedTestCallData = this.getExpectedAzureDevOpsTestCallData();
			break;
		case 'slack':
			expectedTestCallData = this.getExpectedSlackTestCallData();
			break;
		case 'msteams':
			expectedTestCallData = this.getExpectedMSTeamsTestCallData();
			break;
		case 'glip':
			expectedTestCallData = this.getExpectedGlipTestCallData();
			break;
		default:
			throw `unknown provider ${this.provider}`;
		}
		expectedData.accessToken = this.mockToken;
		if (expectedTestCallData) {
			expectedData._testCall = expectedTestCallData;
		}
		let key = `providerInfo.${this.team.id}.${this.provider}`;
		if (this.testHost) {
			const host = this.testHost.replace(/\./g, '*');
			key += `.hosts.${host}`;
		}
		// issue the provider-token request, and establish the message we expect to receive
		this.message = {
			user: {
				id: this.currentUser.user.id,
				_id: this.currentUser.user.id, // DEPRECATE ME
				$set: {
					version: 4,
					modifiedAt: Date.now()
				},
				$version: {
					before: 3,
					after: 4
				}
			}
		};
		for (let dataKey of Object.keys(expectedData)) {
			const setKey = key + `.${dataKey}`;
			this.message.user.$set[setKey] = expectedData[dataKey];
		}
		callback();
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.requestSentAt, 'modifiedAt not set');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		let key = `providerInfo.${this.team.id}.${this.provider}`;
		if (this.testHost) {
			const host = this.testHost.replace(/\./g, '*');
			key += `.hosts.${host}`;
		}
		const providerSet = message.message.user.$set;
		const expectedProviderSet = this.message.user.$set;
		if (['jira', 'asana', 'bitbucket', 'gitlab', 'azuredevops', 'glip', 'msteams'].includes(this.provider)) {
			expectedProviderSet[`${key}.refreshToken`] = 'refreshMe';
			const expiresIn = ['bitbucket', 'gitlab'].includes(this.provider) ? 7200 : 
				this.provider === 'azuredevops' ? 3599 : 3600;
			const expiresAtKey = `${key}.expiresAt`;
			const providerExpiresAt = providerSet[expiresAtKey];
			Assert(providerExpiresAt > this.requestSentAt + (expiresIn - 6) * 1000, `expiresAt not set for ${this.provider}`);
			expectedProviderSet[expiresAtKey] = providerExpiresAt;
		}
		if (this.provider === 'trello') {
			expectedProviderSet[`${key}.apiKey`] = TrelloConfig.apiKey;
			expectedProviderSet[`${key}.data`] = {
				apiKey: TrelloConfig.apiKey
			};
		}
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;

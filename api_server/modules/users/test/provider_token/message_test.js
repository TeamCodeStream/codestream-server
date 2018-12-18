'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const ProviderTokenTest = require('./provider_token_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TrelloConfig = require(process.env.CS_API_TOP + '/config/trello');

/* eslint no-console: 0 */

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `user should receive a message with the token data after authenticating with ${this.provider}`;
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
		default:
			throw `unknown provider ${this.provider}`;
		}
		expectedData.accessToken = this.mockToken;
		if (expectedTestCallData) {
			expectedData._testCall = expectedTestCallData;
		}
		// issue the provider-token request, and establish the message we expect to receive
		this.message = {
			user: {
				id: this.currentUser.user.id,
				_id: this.currentUser.user.id, // DEPRECATE ME
				$set: {
					version: 4,
					modifiedAt: Date.now(),
					[`providerInfo.${this.team.id}.${this.provider}`]: expectedData
				},
				$version: {
					before: 3,
					after: 4
				}
			}
		};
		callback();
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt > this.requestSentAt, 'modifiedAt not set');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		const providerInfo = message.message.user.$set[`providerInfo.${this.team.id}.${this.provider}`];
		const expectedProviderInfo = this.message.user.$set[`providerInfo.${this.team.id}.${this.provider}`];
		if (this.provider === 'asana') {
			Assert(providerInfo.expiresAt > this.requestSentAt + 3590 * 1000, 'expiresAt not set for asana');
			expectedProviderInfo.expiresAt = providerInfo.expiresAt;
			expectedProviderInfo.refreshToken = 'refreshMe';
		}
		else if (this.provider === 'jira') {
			Assert(providerInfo.expiresAt > this.requestSentAt + 3590 * 1000, 'expiresAt not set for asana');
			expectedProviderInfo.expiresAt = providerInfo.expiresAt;
		}
		else if (this.provider === 'trello') {
			expectedProviderInfo.apiKey = TrelloConfig.apiKey;
		}
		console.warn('MSG', JSON.stringify(message, undefined, 5));
		console.warn('EXP', JSON.stringify(this.message, undefined, 5));
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;

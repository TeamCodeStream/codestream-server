'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const NewRelicIDPConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/newrelic_idp_constants');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.serviceGatewayEnabled = true;
	}

	get description () {
		return 'user should receive a message with the token data after refreshing a New Relic access token';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.currentUser = this.signupResponse;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// token data is received on their own me-channel
		this.channelName = `user-${this.signupResponse.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.messageSentAt = Date.now();
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/provider-refresh/newrelic',
				data: this.data
			},
			callback
		);
	}

	validateMessage (message) {
		const teamId = this.signupResponse.teams[0].id;
		const { $set } = message.message.user;
		const { modifiedAt } = $set;
		Assert(typeof modifiedAt === 'number' && modifiedAt >= this.messageSentAt);
		const expiresAt = $set['accessTokens.web.expiresAt'];
		Assert(typeof expiresAt === 'number' && expiresAt > this.messageSentAt);
		const accessToken = $set['accessTokens.web.token'];
		Assert(typeof accessToken === 'string' && accessToken.startsWith('MNRI-'));
		const refreshToken = $set['accessTokens.web.refreshToken'];
		Assert(typeof refreshToken === 'string' && refreshToken.startsWith('MNRR-'));
		const providerInfoKey = `providerInfo.${teamId}.newrelic`;
		const provider = NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY;
		this.message = {
			user: {
				id: this.signupResponse.user.id,
				_id: this.signupResponse.user.id,
				$version: {
					before: 1,
					after: 2
				},
				$set: {
					version: 2,
					modifiedAt,
					'accessTokens.web.token': accessToken,
					'accessTokens.web.refreshToken': refreshToken,
					'accessTokens.web.expiresAt': expiresAt,
					'accessTokens.web.provider': provider,
					[`${providerInfoKey}.accessToken`]: accessToken,
					[`${providerInfoKey}.refreshToken`]: refreshToken,
					[`${providerInfoKey}.expiresAt`]: expiresAt,
					[`${providerInfoKey}.provider`]: provider
				}
			}
		};
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;

'use strict';

const Assert = require('assert');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const CompanyTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/test/company_test_constants');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.usingNRLogins = true;
	}

	get description () {
		const unifiedIdentity = this.unifiedIdentityEnabled ? ', under unified identity' : '';
		return `should send a Notification Change event for tracking purposes when user follows email link to unfollow a codemark${unifiedIdentity}`;
	}

	// before the test runs...
	makeData (callback) {
		this.makeTestGroupData = true;
		this.init(callback);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user originating the request, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: this.path,
				testTracking: true,
				reallyTrack: true,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			callback
		);
	}

	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		const { type, data } = message;
		if (type !== 'track') {
			return false;
		}

		const expectedMetaData = {
			codestream_first_signin: new Date(this.currentUser.user.createdAt).toISOString(),
			codestream_organization_created: new Date(this.team.createdAt).toISOString(),
			codestream_organization_id: this.company.id,
			codestream_nr_organization_id: this.company.linkedNROrgId
		};
		if (Object.keys(this.apiConfig.environmentGroup || {}).length > 0) {
			expectedMetaData.codestream_region = (this.apiConfig.environmentGroup[this.apiConfig.sharedGeneral.runTimeEnvironment] || {}).name;
		}
	
		const expectedMessage = {
			userId: this.currentUser.user.nrUserId,
			event: 'Notification Change',
			messageId: data.messageId || '<missing messageId>',
			timestamp: data.timestamp || '<missing timestamp>',
			anonymousId: data.anonymousId || '<missing anonymousId>',
			type: 'track',
			properties: {
				//user_id: this.currentUser.user.nrUserId,
				platform: 'codestream',
				path: 'N/A (codestream)',
				section: 'N/A (codestream)',
				session_id: data.properties.session_id || '<missing session_id>',
				meta_data_15: JSON.stringify(expectedMetaData),
				meta_data_14: 'change: codemark_unfollowed',
				meta_data_13: 'source_of_change: email_link'
			}
		};

		Assert.deepStrictEqual(data, expectedMessage, 'tracking data not correct');
		return true;
	}
}

module.exports = TrackingTest;

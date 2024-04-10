'use strict';

const InboundEmailMessageTest = require('./inbound_email_message_test');
const Assert = require('assert');
const CompanyTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/test/company_test_constants');

class TrackingTest extends InboundEmailMessageTest {

	constructor (options) {
		super(options);
		this.usingNRLogins = true;
	}

	get description () {
		const unifiedIdentity = this.unifiedIdentityEnabled ? ', under unified identity' : '';
		return `should send a Reply Created event for tracking purposes when handling a reply to a codemark via email${unifiedIdentity}`;
	}

	setTestOptions (callback) {
		this.makeTestGroupData = true;
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 0;
			this.repoOptions.creatorIndex = 0;
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodemark: true,
				wantMarkers: true
			});
			callback();
		});
	}

	// make the data the will be used when issuing the request that triggers the message
	makeData (callback) {
		// perform a little trickery here ... set the current user to the originator of the post,
		// since the mock tracking message will come back on the originator's me-channel
		super.makeData(() => {
			this.users[1].user.joinMethod = 'Added to Team';
			this.currentUser = this.users[1];
			this.broadcasterToken = this.users[1].broadcasterToken;
			callback();
		});
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.to[0].address = `${this.postData[0].post.id}.${this.data.to[0].address}`;
			callback();
		});
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user that is being tracked as the post creator, we use their me-channel
		// we'll be sending the data that we would otherwise send to the tracker
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.users[1].user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// simulate an inbound email by calling the API server's inbound-email
		// call with post data, this should trigger post creation and a publish
		// of the tracker message
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/inbound-email',
				data: this.data,
				testTracking: true,
				reallyTrack: true
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			}
		);
	}

	/* eslint complexity: 0 */
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
	
		const parentId = this.expectedParentId || this.postData[0].codemark.id;
		const parentType = this.expectedParentType || 'Codemark';
		const expectedMessage = {
			userId: this.currentUser.user.nrUserId,
			event: 'Reply Created',
			messageId: data.messageId || '<missing messageId>',
			timestamp: data.timestamp || '<missing timestamp>',
			anonymousId: data.anonymousId || '<missing anonymousId>',
			type: 'track',
			properties: {
				//user_id: this.currentUser.user.nrUserId,
				platform: 'codestream',
				path: 'N/A (codestream)',
				section: 'N/A (codestream)',
				meta_data_15: JSON.stringify(expectedMetaData),
				'Parent ID': parentId,
				'Parent Type': parentType,
				Endpoint: 'Email',
				'First Post?': new Date(this.post.createdAt).toISOString()
			}
		};

		Assert.deepStrictEqual(data, expectedMessage, 'tracking data not correct');
		return true;
	}
}

module.exports = TrackingTest;

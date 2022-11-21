'use strict';

const Assert = require('assert');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const CompanyTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/test/company_test_constants');

class TrackingTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'should send a Notification Change event for tracking purposes when user follows email link to unfollow a review';
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

		const plan = this.isOnPrem() ? CompanyTestConstants.DEFAULT_ONPREM_COMPANY_PLAN : CompanyTestConstants.DEFAULT_COMPANY_PLAN;
		const trial = this.isOnPrem() ? CompanyTestConstants.ONPREM_COMPANIES_ON_TRIAL : CompanyTestConstants.COMPANIES_ON_TRIAL;
		const expectedMessage = {
			userId: this.currentUser.user.id,
			event: 'Notification Change',
			properties: {
				$created: new Date(this.currentUser.user.registeredAt).toISOString(),
				$email: this.currentUser.user.email,
				name: this.currentUser.user.fullName,
				'Join Method': 'Added to Team',
				'Team ID': this.team.id,
				'Team Size': 3,
				'Team Name': this.team.name,
				'Team Created Date': new Date(this.team.createdAt).toISOString(),
				Plan: plan,
				'Company Name': this.company.name,
				'Company ID': this.company.id,
				'Reporting Group': '',
				distinct_id: this.currentUser.user.id,
				Change: 'Review Unfollowed',
				'Source of Change': 'Email link',
				'Last Invite Type': 'invitation',
				company: {
					id: this.company.id,
					name: this.company.name,
					created_at: new Date(this.company.createdAt).toISOString(),
					plan
				},
				'AB Test': Object.keys(this.testGroupData).map(key => {
					return `${key}|${this.testGroupData[key]}`;
				}),
				'CodeStream Only': true,
				'Org Origination': 'CS'
			}
		};
		if (Object.keys(this.apiConfig.environmentGroup || {}).length > 0) {
			expectedMessage.properties.Region = (this.apiConfig.environmentGroup[this.apiConfig.sharedGeneral.runTimeEnvironment] || {}).name;
		}
		if (trial) {
			Object.assign(expectedMessage.properties.company, {
				trialStart_at: new Date(this.company.trialStartDate).toISOString(),
				trialEnd_at: new Date(this.company.trialEndDate).toISOString()
			});
		}
		Assert.deepEqual(data, expectedMessage, 'tracking data not correct');
		return true;
	}
}

module.exports = TrackingTest;

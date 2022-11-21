'use strict';

const InboundEmailMessageTest = require('./inbound_email_message_test');
const Assert = require('assert');
const CompanyTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/test/company_test_constants');

class TrackingTest extends InboundEmailMessageTest {

	get description () {
		return 'should send a Reply Created event for tracking purposes when handling a reply to a codemark via email';
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
		const parentId = this.expectedParentId || this.postData[0].codemark.id;
		const parentType = this.expectedParentType || 'Codemark';
		const plan = this.isOnPrem() ? CompanyTestConstants.DEFAULT_ONPREM_COMPANY_PLAN : CompanyTestConstants.DEFAULT_COMPANY_PLAN;
		const trial = this.isOnPrem() ? CompanyTestConstants.ONPREM_COMPANIES_ON_TRIAL : CompanyTestConstants.COMPANIES_ON_TRIAL;
		const abTest = Object.keys(this.testGroupData).map(key => {
			return `${key}|${this.testGroupData[key]}`;
		});
		const { properties } = data;
		const errors = [];
		let result = (
			((data.userId === this.users[1].user.id) || errors.push('userId not set to post originator\'s ID')) && 
			((data.event === 'Reply Created') || errors.push('event not correct')) &&
			((properties['Parent ID'] === parentId) || errors.push('Parent ID not set to codemark or review ID')) &&
			((properties['Parent Type'] === parentType) || errors.push('Parent Type not correct')) && 
			((properties.distinct_id === this.users[1].user.id) || errors.push('distinct_id not set to post originator\'s ID')) &&
			((properties['$email'] === this.users[1].user.email) || errors.push('email does not match post originator')) &&
			((properties['name'] === this.users[1].user.fullName) || errors.push('name does not match post originator')) &&
			((properties['Join Method'] === this.users[1].user.joinMethod) || errors.push('Join Method does not match post originator')) &&
			((properties['Last Invite Type'] === this.users[1].user.lastInviteType) || errors.push('Last Invite Type does not match post originator')) &&
			((properties['Team ID'] === this.team.id) || errors.push('Team ID does not match team')) &&
			((properties['Team Name'] === this.team.name) || errors.push('Team Name does not match team')) &&			
			((properties['Team Size'] === this.team.memberIds.length) || errors.push('Team Size does not match number of members in team')) &&
			((properties['Team Created Date'] === new Date(this.team.createdAt).toISOString()) || errors.push('Team Created Date not correct')) &&
			((properties['Plan'] === plan) || errors.push('Plan not correct')) &&
			((properties['Company Name'] === this.company.name) || errors.push('Company Name does not match name of company')) &&
			((properties['Company ID'] === this.company.id) || errors.push('Company ID does not match ID of company')) &&
			((properties.Endpoint === 'Email') || errors.push('Endpoint not correct')) &&
			((properties['Date of Last Post'] === new Date(this.post.createdAt).toISOString()) || errors.push('Date of Last Post not correct')) &&
			((properties['$created'] === new Date(this.users[1].user.registeredAt).toISOString()) || errors.push('createdAt not correct')) &&
			((properties['First Post?'] === new Date(this.post.createdAt).toISOString()) || errors.push('First Post not set to creation date of post')) &&
			((properties['Reporting Group'] === '') || errors.push('Reporting Group should be empty string')) &&
			((properties.company.id === this.company.id) || errors.push('company.id not correct')) &&
			((properties.company.name === this.company.name) || errors.push('company.name not correct')) &&
			((properties.company.created_at === new Date(this.company.createdAt).toISOString()) || errors.push('company.createdAt not correct')) &&
			((properties.company.plan === plan) || errors.push('company.plan not correct')) &&
			((properties['CodeStream Only'] === true) || errors.push('CodeStream Only should be true')) &&
			((properties['Org Origination'] === 'CS') || errors.push('Org Origination should be CS'))
		);
		if (Object.keys(this.apiConfig.environmentGroup || {}).length > 0) {
			result &&= (properties.Region === (this.apiConfig.environmentGroup[this.apiConfig.sharedGeneral.runTimeEnvironment] || {}).name) || errors.push('Region not correct');
		}
		if (trial) {
			result = result && (
				((properties.company.trialStart_at === new Date(this.company.trialStartDate).toISOString()) || errors.push('company.trialStart_at not correct')) &&
				((properties.company.trialEnd_at === new Date(this.company.trialEndDate).toISOString()) || errors.push('company.trialEnd_at not correct'))
			);
		}
		Assert.deepStrictEqual(properties['AB Test'], abTest, 'AB Test is not correct');

		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		return true;
	}
}

module.exports = TrackingTest;

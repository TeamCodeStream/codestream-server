'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class NoMoreTeamMessagesTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 50000;
		this.testTimeout = 60000;
	}


	get description () {
		return 'once a user is removed from a team, they should no longer receive messages on the team channel';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// form the data for the team update
	makeTeamData (callback) {
		// remove the current user from the team, that user will then listen
		// for messages on the team channel, but shouldn't see them
		super.makeTeamData(() => {
			this.data.$pull = {
				memberIds: this.currentUser.id
			};
			callback();
		});
	}

	// wait a bit for the subscribe to take before we generate the test 
	// message ... this seems necessary to ensure we get the proper revoke
	// message once permission is revoked by the server
	waitForSubscribe (callback) {
		setTimeout(callback, 3000);
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		BoundAsync.series(this, [
			this.removeUser,
			this.waitForRevoke,
			this.doTeamUpdate
		], callback);
	}

	// generate the message by issuing a request
	removeUser (callback) {
		// this is the initial update, removing the user from the team,
		// which should revoke their subscription to the team channel
		// and prevent any further messages from being received
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: this.data,
				token: this.otherUserData[0].accessToken
			},
			callback
		);
	}
		
	// wait a bit for the revoke to take effect
	waitForRevoke (callback) {
		this.revokeCallback = callback;
		this.revokeTimeout = setTimeout(() => {
			delete this.revokeTimeout;
			callback();
		}, 30000);
	}

	// called when the subscription has failed, after it has succeeded,
	// we use this event to tell us when it is safe to continue with the test
	onSubscribeFail () {
		if (this.revokeTimeout) {
			clearTimeout(this.revokeTimeout);
			this.revokeCallback();
		}
	}

	// do another team update, this will generate a message on the team channel,
	// but the removed user should not see the message
	doTeamUpdate (callback) {
		this.newTeamName = this.teamFactory.randomName();
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: { name: this.newTeamName },
				token: this.otherUserData[0].accessToken
			},
			callback
		);
	}
    
	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		if (this.newTeamName) {
			Assert.fail('message was received on team channel after user was removed');
		}
	}

}

module.exports = NoMoreTeamMessagesTest;

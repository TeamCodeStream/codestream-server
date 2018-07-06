'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var CommonInit = require('./common_init');

class UserAddedToTeamGetsMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'registered user who is invited to a team should get a message that they have been added, with team and repo info';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// establish the PubNub clients we will use to send and receive a message
	makePubnubClients (callback) {
		// need the right token to subscribe to the existing user's me-channel
		this.currentUserToken = this.token;
		this.pubNubToken = this.existingUserData.pubNubToken;
		super.makePubnubClients(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// user should get a message on their me-channel
		this.channelName = 'user-' + this.existingUserData.user._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the updated post
		this.setExpectedMessage();
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: this.data,
				token: this.currentUserToken
			},
			callback
		);
	}

	// set the message we expect to receive
	setExpectedMessage () {
		this.team.memberIds.push(this.existingUserData.user._id);
		this.team.memberIds.sort();
		Object.assign(this.teamCreatorData.user, {
			teamIds: [this.team._id],
			companyIds: [this.company._id],
			joinMethod: 'Created Team',
			primaryReferral: 'external',
			originTeamId: this.team._id
		});
		Object.assign(this.currentUser, {
			teamIds: [this.team._id],
			companyIds: [this.company._id],
			joinMethod: 'Added to Team',
			primaryReferral: 'internal',
			originTeamId: this.team._id
		});
		this.message = {
			user: {
				_id: this.existingUserData.user._id,
				$addToSet: {
					teamIds: this.team._id,
					companyIds: this.company._id
				}
			},
			company: this.company,
			team: this.team,
			repos: [this.repo],
			users: [this.teamCreatorData.user, this.currentUser]
		};
		this.message.users.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
	}

	// validate the received message
	validateMessage (message) {
		message.message.team.memberIds.sort();
		message.message.users.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		return super.validateMessage(message);
	}
}

module.exports = UserAddedToTeamGetsMessageTest;

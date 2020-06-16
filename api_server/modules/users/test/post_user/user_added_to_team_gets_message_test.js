'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

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
	makeBroadcasterForClient (callback) {
		// need the right token to subscribe to the existing user's me-channel
		this.currentUser = this.existingUserData;
		this.currentUserToken = this.token;
		super.makeBroadcasterForClient(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// user should get a message on their me-channel
		this.channelName = 'user-' + this.existingUserData.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the updated post
		this.updatedAt = Date.now();
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
		this.team.memberIds.push(this.existingUserData.user.id);
		this.team.memberIds.sort();
		const teamCreatorData = this.users[this.teamOptions.creatorIndex];
		Object.assign({}, teamCreatorData.user, {
			teamIds: [this.team.id],
			companyIds: [this.company.id],
			joinMethod: 'Created Team',
			primaryReferral: 'external',
			originTeamId: this.team.id
		});
		Object.assign({}, this.currentUser, {
			teamIds: [this.team.id],
			companyIds: [this.company.id],
			joinMethod: 'Added to Team',
			primaryReferral: 'internal',
			originTeamId: this.team.id
		});

		this.message = {
			company: this.company,
			team: this.team,
			repos: [],
			users: [teamCreatorData.user, this.currentUser.user]
		};
		this.message.users.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
	}

	// validate the received message
	validateMessage (inMessage) {
		Assert(inMessage.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		const message = inMessage.message;
		const expectedUserOp = {
			_id: this.existingUserData.user.id,	// DEPRECATE ME
			id: this.existingUserData.user.id,
			$addToSet: {
				teamIds: this.team.id,
				companyIds: this.company.id
			},
			$set: {
				joinMethod: 'Added to Team',
				primaryReferral: 'internal',
				originTeamId: this.team.id,
				modifiedAt: inMessage.message.user.$set.modifiedAt,
				version: 3
			},
			$version: {
				before: 2,
				after: 3
			}
		};
		Assert.deepEqual(message.user, expectedUserOp, 'user op not correct');
		Assert.equal(message.company.id, this.company.id, 'company ID not correct');
		Assert.equal(message.team.id, this.team.id, 'team ID not correct');
		const expectedUserIds = this.team.memberIds;
		expectedUserIds.sort();
		const userIds = message.users.map(u => u.id);
		userIds.sort();
		Assert.deepEqual(userIds, expectedUserIds, 'user IDs not correct');
		return true;
	}
}

module.exports = UserAddedToTeamGetsMessageTest;

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('../common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewUserMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.streamOptions.isTeamStream = true;
	}

	get description () {
		return 'when an existing registered user is added to a team while creating a post with a codemark, the user should get a message indicating they have been added to the team';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		BoundAsync.series(this, [
			this.createRegisteredUser, // create a registered user first, then add them
			super.makePostData,
			this.addNewUserEmail
		], callback);
	}

	createRegisteredUser (callback) {
		const data = this.userFactory.getRandomUserData();
		data._confirmationCheat = this.apiConfig.secrets.confirmationCheat;
		this.userFactory.createUser(
			data,
			(error, response) => {
				if (error) { return callback(error); }
				this.addedUser = response;
				callback();
			}
		);
	}

	addNewUserEmail (callback) {
		this.data.addedUsers = [this.addedUser.user.email];
		this.data._subscriptionCheat = this.apiConfig.secrets.subscriptionCheat;
		callback();
	}

	// establish the PubNub clients we will use to send and receive a message
	makeBroadcasterForClient (callback) {
		// need the right token to subscribe to the existing user's me-channel
		this.currentUser = this.addedUser;
		this.currentUserToken = this.token;
		super.makeBroadcasterForClient(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// should get a message on the registered user's me-channel
		this.channelName = 'user-' + this.addedUser.user.id;
		this.currentUser = this.addedUser;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the added users
		this.postCreatedAfter = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.team.memberIds.push(this.addedUser.user.id);
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
				callback();
			}
		);
	}

	validateMessage (inMessage) {
		Assert(inMessage.message.user.$set.modifiedAt >= this.postCreatedAfter, 'modifiedAt not changed');
		const message = inMessage.message;
		const expectedUserOp = {
			_id: this.addedUser.user.id,	// DEPRECATE ME
			id: this.addedUser.user.id,
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

module.exports = NewUserMessageTest;

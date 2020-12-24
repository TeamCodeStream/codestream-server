'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const User = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class RepoBasedSignupMessageToTeamTest extends CodeStreamMessageTest {

	constructor(options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
		this.repoOptions.creatorIndex = 0;
	}

	get description() {
		return 'team members should receive a user message when a user registers via repo-based signup to join a team';
	}

	// set the channel name we expect to receive a message on
	setChannelName(callback) {
		// newly registered users should be seen on the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// before the test runs...
	before(callback) {
		BoundAsync.series(this, [
			super.before,
			this.setTeamSettings,
			this.setRepoSignupData
		], callback);
	}

	// set the team settings to enable the auto-join feature
	setTeamSettings(callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.team.id}`,
				token: this.users[0].accessToken,
				data: {
					autoJoinRepos: [this.repo.id]
				}
			},
			callback
		);
	}

	// set the data to pass with the request indicating repo-based signup
	setRepoSignupData(callback) {
		callback();
	}

	// issue the request that generates the message we expect to see
	generateMessage(callback) {
		// establish random user data for the registration, and add repo signup data
		const requestData = this.userFactory.getRandomUserData();
		delete requestData._forceConfirmation;
		requestData.teamId = this.team.id;
		requestData.repoId = this.repo.id;
		requestData.commitHash = this.repo.knownCommitHashes[0];

		// the message we expect to receive has a sanitized user object
		const userData = Object.assign({}, requestData);
		delete userData.password;
		delete userData.teamId;
		delete userData.repoId;
		delete userData.commitHash;
		userData.teamIds = [this.team.id];
		userData.companyIds = [this.team.companyId];
		let userObject = new User(userData).getSanitizedObject();
		this.message = {
			users: [userObject]
		};

		this.requestSentAt = Date.now();
		this.userFactory.registerUser(requestData, callback);
	}

	// validate the received message
	messageReceived(error, message) {
		if (message && message.message && message.message.users && message.message.users[0]) {
			// no way of knowing what this will be, so just set it to what we receive before we compare
			this.message.users[0]._id = this.message.users[0].id = message.message.users[0].id;
			this.message.users[0].creatorId = this.message.users[0].id;
			Assert(message.message.users[0].modifiedAt >= this.requestSentAt, 'modifiedAt is not greater than or equal to when the request was sent');
			Assert(message.message.users[0].createdAt >= this.requestSentAt, 'createdAt is not greater than or equal to when the request was sent');
			this.message.users[0].modifiedAt = message.message.users[0].modifiedAt;
			this.message.users[0].createdAt = message.message.users[0].createdAt;
		}
		return super.messageReceived(error, message);
	}
}

module.exports = RepoBasedSignupMessageToTeamTest;

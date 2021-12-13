'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ForeignMembersMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team that owns a code error should receive a message with foreign members added when a reply is made to the code error from the New Relic comment engine, with mentions';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.createNRComment,
			this.makeReplyData,
			this.claimCodeError
		], callback);
	}
	
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			this.userOptions.numUnregistered = 2;
			this.teamOptions.creatorIndex = 1;
			this.teamOptions.members = [0, 3];
			this.mentionedUsersOnTeam = [1, 3];
			this.mentionedUsersNotOnTeam = [2, 4];
			callback();
		});
	}

	makeReplyData (callback) {
		const { post } = this.nrCommentResponse;
		this.data = {
			...this.requestData,
			accountId: post.accountId,
			objectId: post.objectId,
			objectType: post.objectType,
			parentPostId: post.id
		};
		this.mentionedEmails = [
			this.userFactory.randomEmail()
		];
		this.message = {
			team: {
				id: this.team.id,
				_id: this.team.id, // DEPRECATE ME
				$addToSet: {
					foreignMemberIds: [],
					memberIds: []
				},
				$set: {
					modifiedAt: Date.now(), // placeholder
					version: 6
				},
				$version: {
					before: 5,
					after: 6
				}
			}
		};
		this.mentionedUsersOnTeam.forEach(nUser => {
			this.mentionedEmails.push(this.users[nUser].user.email);
		});
		this.mentionedUsersNotOnTeam.forEach(nUser => {
			this.mentionedEmails.push(this.users[nUser].user.email);
			this.message.team.$addToSet.foreignMemberIds.push(this.users[nUser].user.id);
			this.message.team.$addToSet.memberIds.push(this.users[nUser].user.id);
		});
		this.data.mentionedUsers = this.mentionedEmails.map(email => { 
			return { email };
		});
		callback();
	}

	createNRComment (callback) {
		if (!this.nrCommentResponse) {
			return super.createNRComment(callback);
		}
		super.createNRComment(error => {
			if (error) { return callback(error); }
			const newUserId = Object.keys(this.nrCommentResponse.post.userMaps).find(userId => {
				return this.nrCommentResponse.post.userMaps[userId].email === this.mentionedEmails[0];
			});
			this.message.team.$addToSet.foreignMemberIds.push(newUserId);
			this.message.team.$addToSet.memberIds.push(newUserId);
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// when posted to a team stream, it is the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.createNRComment(callback);
	}

	validateMessage (message) {
		if (!message.message.team) {
			return false;
		}

		const actualTeam = message.message.team;
		const expectedTeam = this.message.team;

		actualTeam.$addToSet.foreignMemberIds.sort();
		expectedTeam.$addToSet.foreignMemberIds.sort();
		actualTeam.$addToSet.memberIds.sort();
		expectedTeam.$addToSet.memberIds.sort();

		Assert(actualTeam.$set.modifiedAt >= this.createdAfter, 'modifiedAt for team update was not set to after the comment was created');
		expectedTeam.$set.modifiedAt = actualTeam.$set.modifiedAt;

		return super.validateMessage(message);
	}
}

module.exports = ForeignMembersMessageToTeamTest;

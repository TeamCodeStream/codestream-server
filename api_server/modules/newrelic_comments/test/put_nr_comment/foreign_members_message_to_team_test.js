'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ForeignMembersMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team that owns a code error should receive a message with foreign members added when an update is made to the reply to a code error from the New Relic comment engine, with mentions';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
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

	makeUpdateData (callback) {
		this.mentionedEmails = [
			this.userFactory.randomEmail()
		];
		this.teamMessage = {
			team: {
				id: this.team.id,
				_id: this.team.id, // DEPRECATE ME
				$addToSet: {
					foreignMemberIds: [],
					memberIds: []
				},
				$set: {
					version: 6,
					modifiedAt: Date.now()
				},
				$version: {
					before: 5,
					after: 6
				}
			}
		}

		this.mentionedUsersOnTeam.forEach(nUser => {
			this.mentionedEmails.push(this.users[nUser].user.email);
		});
		this.mentionedUsersNotOnTeam.forEach(nUser => {
			this.mentionedEmails.push(this.users[nUser].user.email);
			this.teamMessage.team.$addToSet.foreignMemberIds.push(this.users[nUser].user.id);
			this.teamMessage.team.$addToSet.memberIds.push(this.users[nUser].user.id);
		});

		super.makeUpdateData(error => {
			if (error) { return callback(error); }
			this.data.mentionedUsers = this.mentionedEmails.map(email => { 
				return { email };
			});
			callback();
		});
	}	


	updateNRComment (callback) {
		super.updateNRComment(error => {
			if (error) { return callback(error); }
			const newUserId = Object.keys(this.nrUpdateResponse.post.userMaps).find(userId => {
				return this.nrUpdateResponse.post.userMaps[userId].email === this.mentionedEmails[0];
			});
			this.message = this.teamMessage;
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
		this.updateNRComment(callback);
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

		Assert(actualTeam.$set.modifiedAt >= this.updatedAfter, 'modifiedAt for team update was not set to after the comment was updated');
		expectedTeam.$set.modifiedAt = actualTeam.$set.modifiedAt;

		return super.validateMessage(message);
	}
}

module.exports = ForeignMembersMessageToTeamTest;

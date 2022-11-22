'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const which = this.byDomainJoining ? 'by domain joining' : 'by invite under one-user-per-org';
		return `when a user joins a company ${which}, other members of the team should get a message that the user has been added`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		// don't try to listen as the user who is joining, listen as the team creator
		this.listeningUserIndex = 1;
		this.testBeganAt = Date.now();
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the user's me-channel channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the join, which will trigger the message
		this.doJoin(callback);
	}

	validateMessage (message) {
		Assert(message.message.team.$set.modifiedAt >= this.joinedAfter, 'team modifiedAt is not greater than or equal to when the user joined');
		const userInMessage = { ...this.currentUser.user };
		delete userInMessage.originUserId; // this is a "me" attribute
		this.message = {
			users: [userInMessage],
			team: {
				id: this.team.id,
				_id: this.team.id,
				$set: {
					modifiedAt: message.message.team.$set.modifiedAt,
					version: this.expectedVersion
				},
				$addToSet: {
					memberIds: [ this.joinResponse.userId ]
				},
				$pull: {
					removedMemberIds: [ this.joinResponse.userId ],
					foreignMemberIds: [ this.joinResponse.userId ]
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};

		const actualUser = message.message.users[0];
		const expectedUser = this.message.users[0];
		Object.assign(expectedUser, {
			teamIds: [this.team.id],
			companyIds: [this.company.id],
			id: this.joinResponse.userId,
			_id: this.joinResponse.userId,
			creatorId: this.byDomainJoining ? this.currentUser.user.id : this.users[1].user.id,
			joinMethod: this.byDomainJoining ? 'Joined Team by Domain' : 'Added to Team',
			originTeamId: this.team.id,
			primaryReferral: this.byDomainJoining ? 'external' : 'internal',
			version: this.byDomainJoining ? 1 : 2
		});

		// these are present only for invites
		if (!this.byDomainJoining) {
			expectedUser.firstInviteType = expectedUser.lastInviteType = 'invitation';
		}

		// these are present in the original confirmed user, but not the copy
		['preferences', 'lastReads', 'lastLogin', 'firstSessionStartedAt'].forEach(attribute => {
			delete expectedUser[attribute];
		});
		if (this.byDomainJoining) {
			delete expectedUser.originTeamId;
		}

		// these should be updated by the invite
		['createdAt', 'registeredAt'].forEach(attribute => {
			Assert(actualUser[attribute] >= this.testBeganAt, `user ${attribute} is not greater than or equal to when the test began`);
			expectedUser[attribute] = actualUser[attribute];
		});
			
		// these should be updated by the join
		['modifiedAt'].forEach(attribute => {
			Assert(actualUser[attribute] >= this.joinedAfter, `user ${attribute} is not greater than or equal to when the user joined`);
			expectedUser[attribute] = actualUser[attribute];
		});

		Assert(typeof actualUser.nrUserId === 'string', 'nrUserId not set');
		expectedUser.nrUserId = actualUser.nrUserId;

		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;

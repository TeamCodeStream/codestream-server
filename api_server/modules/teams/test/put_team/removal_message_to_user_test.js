'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class RemovalMessageToUserTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team who are removed should receive a message on their me-channel that they have been removed from the team';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// form the data for the team update
	makeTeamData (callback) {
		// remove current user from the team, that user will then try to subscribe
		super.makeTeamData(() => {
			this.data.$addToSet = {
				removedMemberIds: this.currentUser.user.id
			};
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// user with the team removed from their teamIds
		this.otherUserUpdatesTeam = true;
		this.updatedAt = Date.now();
		const expectedVersion = this.currentUser.user.version + 1;
		this.updateTeam(error => {
			if (error) { return callback(error); }
			this.message = {
				user: {
					_id: this.currentUser.user.id,	// DEPRECATE ME
					id: this.currentUser.user.id,
					$pull: {
						teamIds: this.team.id,
						companyIds: this.team.companyId
					},
					$set: {
						version: expectedVersion,
						deactivated: true,
						email: 'placeholder'
					},
					$version: {
						before: expectedVersion - 1,
						after: expectedVersion
					}
				}
			};
			callback();
		});
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		Assert(message.message.user.$set.email.match(/.*-deactivated[0-9]+@.*/, 'email not a deactivated labelled email'));
		this.message.user.$set.email = message.message.user.$set.email;
		return super.validateMessage(message);
	}
}

module.exports = RemovalMessageToUserTest;

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');

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
			this.data.$pull = {
				memberIds: this.currentUser.user._id
			};
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// user with the team removed from their teamIds
		this.otherUserUpdatesTeam = true;
		this.updateTeam(error => {
			if (error) { return callback(error); }
			this.message = {
				user: {
					_id: this.currentUser.user._id,
					$pull: {
						teamIds: this.team._id
					},
					$set: {
						version: 4
					},
					$version: {
						before: 3,
						after: 4
					}
				}
			};
			callback();
		});
	}
}

module.exports = RemovalMessageToUserTest;

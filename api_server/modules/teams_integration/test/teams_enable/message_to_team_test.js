'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message when MS Teams integration is enabled for the team';
	}

	// make the data used to initiate the message test
	makeData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.currentUser = this.currentUserData.user;
			this.pubNubToken = this.currentUserData.pubNubToken;
			callback();
		});
	}

	// set the pubnub channel name we expect a message on
	setChannelName (callback) {
		// should come to us on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by triggering a request to the api server
	generateMessage (callback) {
		// send the request to enable MS Teams, this should trigger an update message to the team
		this.requestStartedAt = Date.now();
		this.doApiRequest(
			{
				method: this.method,
				path: this.path,
				data: this.data
			},
			callback
		);
	}

	// validate the received message
	validateMessage (message) {
		// validate we got the correct team data
		const team = message.message.team;
		Assert(team.$set.modifiedAt > this.requestStartedAt, 'modifiedAt of team should be after the request was issued');
		this.message = {
			team: {
				_id: this.team._id,
				$set: {
					'integrations.teams.enabled': true,
					'integrations.teams.info': this.integrationInfo,
					modifiedAt: team.$set.modifiedAt
				}
			}
		};
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamTest;

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const AddRemoteTest = require('./add_remote_test');
const Assert = require('assert');

class UpdateRepoMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, AddRemoteTest) {

	get description () {
		return 'members of the team should receive a message with a repo update when a repo is matched by remote and new remotes are added';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// repo updates comes by the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.matchRepos(error => {
			if (error) { return callback(error); }
			const remoteObject = this.getRemoteObject(this.requestData.repos[0].remotes[1]);
			this.message = {
				repos: [{
					_id: this.repo.id, // DEPRECATE ME
					id: this.repo.id,
					$push: {
						remotes: [remoteObject]
					},
					$set: {
						version: 2,
						modifiedAt: 0 // placeholder
					},
					$version: {
						before: 1,
						after: 2
					}
				}]
			};
			callback();
		});
	}

	// validate the incoming message
	validateMessage (message) {
		Assert(message.message.repos[0].$set.modifiedAt >= this.modifiedAfter, 'modifiedAt not changed');
		this.message.repos[0].$set.modifiedAt = message.message.repos[0].$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = UpdateRepoMessageTest;

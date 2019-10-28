'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CreateRepoTest = require('./create_repo_test');

class CreateRepoMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, CreateRepoTest) {

	get description () {
		return 'members of the team should receive a message with the new repo when a match is tried to be found for a repo and no match is found so a repo is created';
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
			const repoCreated = this.testResponse.repos[0];
			this.message = {
				repos: [repoCreated]
			};
			callback();
		});
	}
}

module.exports = CreateRepoMessageTest;

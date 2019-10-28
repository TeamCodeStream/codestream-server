'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const AddCommitHashTest = require('./add_commit_hash_test');
const Assert = require('assert');

class UpdateRepoWithCommitHashMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, AddCommitHashTest) {

	get description () {
		return 'members of the team should receive a message with a repo update when a repo is matched by remote and new known commit hashes are added';
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
			const commitHash = this.requestData.repos[0].knownCommitHashes[0].toLowerCase();
			this.message = {
				repos: [{
					_id: this.repo.id, // DEPRECATE ME
					id: this.repo.id,
					$addToSet: {
						knownCommitHashes: [commitHash]
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

module.exports = UpdateRepoWithCommitHashMessageTest;

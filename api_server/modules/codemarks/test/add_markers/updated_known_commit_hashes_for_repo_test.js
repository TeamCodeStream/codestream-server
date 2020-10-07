'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const AddMarkersTest = require('./add_markers_test');
const Assert = require('assert');

class UpdatedKnownCommitHashesForRepoMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, AddMarkersTest) {

	get description () {
		return 'members of the team should receive a message with a repo update when markers are added to a codemark and known commit hashes are specified that were not known for the repo';
	}

	before(callback) {
		CodeStreamMessageTest.prototype.before.call(this, callback);
	}


	// make the data that triggers the message to be received
	makeData (callback) {
		this.expectMarkers = 1;
		this.init(callback);
	}

	makeTestData (callback) {
		super.makeTestData(() => {
			// use existing repo but new remote, this should get added to the existing repo
			const marker = this.data.markers[0];
			marker.repoId = this.repo.id;
			marker.file = this.repoStreams[0].file;
			this.knownCommitHashes = [
				this.markerFactory.randomCommitHash(),
				this.markerFactory.randomCommitHash(),
				this.markerFactory.randomCommitHash()
			];
			marker.knownCommitHashes = [...this.knownCommitHashes];
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// repo updates comes by the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.updatedAt = Date.now();
		this.doApiRequest(
			{
				method: 'put',
				path: `/codemarks/${this.codemark.id}/add-markers`,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				this.reposMessage = [{
					_id: this.repo.id,	// DEPRECATE ME
					id: this.repo.id,
					$addToSet: {
						knownCommitHashes: [
							...this.knownCommitHashes.map(hash => hash.toLowerCase()),
							this.data.markers[0].commitHash.toLowerCase()
						]
					},
					$version: {
						before: 2,
						after: 3
					},
					$set: {
						version: 3
					}
				}];
				callback();
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		Assert(message.message.repos[0].$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.reposMessage[0].$set.modifiedAt = message.message.repos[0].$set.modifiedAt;
		Assert.deepEqual(this.reposMessage, message.message.repos, 'unexpected repos in message');
		return super.validateMessage(message);
	}
}

module.exports = UpdatedKnownCommitHashesForRepoMessageTest;

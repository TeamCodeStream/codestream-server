'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const MarkerTest = require('./marker_test');
const NormalizeUrl = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/normalize_url');
const ExtractCompanyIdentifier = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/extract_company_identifier');
const Assert = require('assert');

class UpdatedSetRepoMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, MarkerTest) {

	get description () {
		return 'members of the team should receive a message with a repo update when a codemark is posted with a marker and remotes are specified that were not known for the repo';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			// use existing repo but new remote, this should get added to the existing repo
			const marker = this.data.markers[0];
			marker.repoId = this.repo.id;
			marker.file = this.repoStreams[0].file;
			this.addedRemote = this.repoFactory.randomUrl();
			marker.remotes = [this.addedRemote];
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
		const normalizedRemote = NormalizeUrl(this.addedRemote);
		const companyIdentifier = ExtractCompanyIdentifier.getCompanyIdentifier(normalizedRemote);
		this.updatedAt = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				this.reposMessage = [{
					_id: this.repo.id,	// DEPRECATE ME
					id: this.repo.id,
					$push: {
						remotes: [{
							url: normalizedRemote,
							normalizedUrl: normalizedRemote,
							companyIdentifier
						}]
					},
					$addToSet: {
						knownCommitHashes: [
							this.data.markers[0].commitHash.toLowerCase()
						]
					},
					$version: {
						before: 1,
						after: 2
					},
					$set: {
						version: 2
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

module.exports = UpdatedSetRepoMessageTest;

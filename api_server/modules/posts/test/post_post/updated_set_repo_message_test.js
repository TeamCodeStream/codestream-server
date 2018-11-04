'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const ItemTest = require('./item_test');
const NormalizeUrl = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const ExtractCompanyIdentifier = require(process.env.CS_API_TOP + '/modules/repos/extract_company_identifier');

class UpdatedSetRepoMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, ItemTest) {

	get description () {
		return 'members of the team should receive a message with a repo update when a post and item are posted with a marker and remotes are specified that were not known for the repo';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			callback();
		});
	}
	
	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	makePostData (callback) {
		super.makePostData(() => {
			// use existing repo but new remote, this should get added to the existing repo
			this.data.item.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
			const marker = this.data.item.markers[0];
			marker.repoId = this.repo._id;
			this.addedRemote = marker.remotes[0];
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// repo updates comes by the team channel
		this.channelName = `team-${this.team._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		const normalizedRemote = NormalizeUrl(this.addedRemote);
		const companyIdentifier = ExtractCompanyIdentifier.getCompanyIdentifier(normalizedRemote);
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = { 
					repos: [{
						_id: this.repo._id,
						$push: {
							remotes: [{
								url: this.addedRemote,
								normalizedUrl: normalizedRemote,
								companyIdentifier
							}]
						},
						$version: {
							before: 1,
							after: 2
						},
						$set: {
							version: 2
						}
					}]
				};
				callback();
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		// ignore the message publishing the new file-stream, we only want the repo message
		if (message.message.stream) { return false; }
		return true;
	}
}

module.exports = UpdatedSetRepoMessageTest;

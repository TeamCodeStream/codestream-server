'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const NormalizeUrl = require(process.env.CS_API_TOP + '/modules/repos/normalize_url');
const ExtractCompanyIdentifier = require(process.env.CS_API_TOP + '/modules/repos/extract_company_identifier');

class UpdatedSetRepoMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with a repo update when a post is posted with a marker and remotes are specified that were not known for the repo';
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

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// repo updates comes by the team channel
		this.channelName = `team-${this.team._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post and a marker from a stream to be created "on-the-fly" ...
		// this should trigger a message to the team channel that indicates the stream was created
		const addRemote = this.repoFactory.randomUrl();
		const normalizedRemote = NormalizeUrl(addRemote);
		const companyIdentifier = ExtractCompanyIdentifier.getCompanyIdentifier(normalizedRemote);
		this.postFactory.createRandomPost(
			error => {
				if (error) { return callback(error); }
				this.message = { 
					repos: [{
						_id: this.repo._id,
						$push: {
							remotes: [{
								url: normalizedRemote,
								normalizedUrl: normalizedRemote,
								companyIdentifier
							}]
						}
					}]
				}; 
				callback();
			},
			{
				token: this.users[1].accessToken,	// the "post creator"
				teamId: this.team._id,
				streamId: this.stream._id,
				wantMarkers: 1,
				markerStream: {
					repoId: this.repo._id,
					remotes: [addRemote],
					file: this.streamFactory.randomFile()
				}
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

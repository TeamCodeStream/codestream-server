// base class for many tests of the "PUT /markers" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.addRemotesToRepo,	// add some remotes to the repo by creating a post
			this.makeMarkerData		// make the data associated with the test marker to be created
		], callback);
	}
	
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		callback();
	}

	// introduce additional remotes to the repo we created by
	// submitting a post and creating a stream on the fly as we do it,
	// with remotes specified in the code block for the post
	addRemotesToRepo (callback) {
		if (!this.wantRemotes) {
			return callback();
		}
		const remotes = [
			...this.repo.remotes.map(repo => repo.url), 
			...this.wantRemotes
		];
		this.postFactory.createRandomPost(
			callback,
			{
				wantCodeBlocks: 1,
				stream: {
					teamId: this.team._id,
					type: 'channel',
					name: this.streamFactory.randomName()
				},
				codeBlockStream: {
					file: this.streamFactory.randomFile(),
					remotes
				},
				token: this.users[1].accessToken
			}
		);
	}
	
	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		this.markerCreatedAfter = Date.now();
		const data = this.markerFactory.getRandomCodeBlockData();
		this.data = Object.assign(data, {
			teamId: this.team._id,
			streamId: this.repoStreams[0]._id,
			providerType: 'slack',
			postId: RandomString.generate(10),
			postStreamId: RandomString.generate(10)
		});
		callback();
	}
}

module.exports = CommonInit;

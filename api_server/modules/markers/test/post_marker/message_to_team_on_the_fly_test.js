'use strict';

const MessageToTeamTest = require('./message_to_team_test');
const Assert = require('assert');

class MessageToTeamOnTheFlyTest extends MessageToTeamTest {

	get description () {
		return 'members of the team should receive a message with the marker and associated stream and repo when a marker is directly created and stream and repo are created on the fly';
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// delete the stream ID and the repo ID, and create a new remote URL to create a repo and stream on the fly
		super.makeMarkerData(() => {
			delete this.data.streamId;
			delete this.data.repoId;
			this.data.file = this.streamFactory.randomFile();
			this.data.remotes = [this.repoFactory.randomUrl()];
			callback();
		});
	}

	// validate the incoming message
	validateMessage (message ) {
		const marker = message.message.marker;
		const stream = message.message.stream;
		const repo = message.message.repo;
		Assert(stream, 'no stream sent in message');
		Assert.equal(marker.streamId, stream._id, 'stream ID of marker does not match the incoming stream');
		Assert(repo, 'no repo sent in message');
		Assert.equal(stream.repoId, repo._id, 'repo ID of stream does not match the incoming repo');
		return super.validateMessage(message);
	}
}

module.exports = MessageToTeamOnTheFlyTest;

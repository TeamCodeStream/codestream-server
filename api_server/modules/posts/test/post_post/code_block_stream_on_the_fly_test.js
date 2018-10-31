'use strict';

const MarkerTest = require('./marker_test');
const Assert = require('assert');

class MarkerStreamOnTheFly extends MarkerTest {

	get description () {
		return `should return the post with marker info when creating a post in a ${this.streamType} stream with a marker for a file for which the stream will be created on the fly`;
	}
	
	// form the data we'll use in creating the post
	makePostData (callback) {
		// specify to create a file-stream for the marker
		this.otherFile = this.streamFactory.randomFile();
		super.makePostData(() => {
			delete this.data.markers[0].streamId;
			Object.assign(this.data.markers[0], {
				file: this.otherFile,
				remotes: this.useRemotes,
				repoId: this.useRemotes ? undefined : this.repo._id
			});
			callback();
		});
	}
    
	// validate the response to the post request
	validateResponse (data) {
		if (!this.dontExpectStreams) {
			const repo = this.createdRepo || this.repo;
			Assert(data.streams, 'expected streams array');
			const stream = data.streams.find(stream => stream._id !== this.stream._id);
			Assert(stream.teamId === this.team._id, 'stream teamId is incorrect');
			Assert(stream.repoId === repo._id, 'stream repoId is incorrect');
			Assert(stream.type === 'file', 'stream type should be file');
			Assert(stream.file === this.otherFile, 'stream file is incorrect');
			this.otherStream = stream;
		}
		super.validateResponse(data);
	}
}

module.exports = MarkerStreamOnTheFly;

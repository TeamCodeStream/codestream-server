'use strict';

const MarkerTest = require('./marker_test');

class MarkerStreamOnTheFly extends MarkerTest {

	constructor (options) {
		super(options);
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOnTheFly = true;
		this.repoOnTheFly = true;
	}

	get description () {
		return `should return the post with marker info when creating an codemark in a ${this.streamType} stream with a marker where the file stream will be created on the fly`;
	}
	
	// form the data we'll use in creating the codemark
	makeCodeMarkData (callback) {
		// specify to create a file-stream for the marker on the fly, instead of the file stream already created
		super.makeCodeMarkData(() => {
			const marker = this.data.markers[0];
			delete marker.fileStreamId;
			Object.assign(marker, {
				file: this.streamFactory.randomFile(),
				remotes: this.useRemotes || [this.repoFactory.randomUrl()]
			});
			callback();
		});
	}
}

module.exports = MarkerStreamOnTheFly;

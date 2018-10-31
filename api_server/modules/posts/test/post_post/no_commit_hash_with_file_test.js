'use strict';

const MarkerFromDifferentStreamTest = require('./marker_from_different_stream_test');

class NoCommitHashWithFileTest extends MarkerFromDifferentStreamTest {

	constructor (options) {
		options = Object.assign(options || {}, { streamType: 'channel' });
		super(options);
		this.dontExpectMarkers = true;
	}

	get description () {
		return 'should be ok to create a post with a marker but not providing a commit hash even if there is a file';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post
		// also remove the stream ID, making the statement that we are not associating the marker with a stream at all...
		// also add a file ... with to stream, this file still shows up with the marker, but is not associate with a stream
		super.makePostData(() => {
			delete this.data.commitHashWhenPosted;
			delete this.data.markers[0].streamId;	
			this.data.markers[0].file = this.streamFactory.randomFile();
			callback();
		});
	}
}

module.exports = NoCommitHashWithFileTest;

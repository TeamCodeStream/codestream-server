'use strict';

const CodeMarkTest = require('./codemark_test');

class CodeMarkMarkerTest extends CodeMarkTest {

	constructor (options) {
		super(options);
		this.expectMarker = true;
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the post with an codemark and a marker when creating a post with codemark info and marker info';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
			callback();
		});
	}
}

module.exports = CodeMarkMarkerTest;

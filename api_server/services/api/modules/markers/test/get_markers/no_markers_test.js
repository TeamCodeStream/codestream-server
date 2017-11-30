'use strict';

var GetMarkersTest = require('./get_markers_test');
var Assert = require('assert');

class NoMarkersTest extends GetMarkersTest {

	constructor (options) {
		super(options);
		this.numPosts = 0;
	}

	getExpectedFields () {
		return {
			streamHasNoMarkers: true
		};
	}

	get description () {
		return 'should return a flag indicating the stream has no markers when requesting markers for a stream that has no markers';
	}

	validateResponse (data) {
		Assert(data.streamHasNoMarkers, 'streamHasNoMarkers is not true');
	}
}

module.exports = NoMarkersTest;

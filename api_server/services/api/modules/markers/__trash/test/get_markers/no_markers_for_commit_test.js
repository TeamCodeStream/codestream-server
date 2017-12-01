'use strict';

var GetMarkersTest = require('./get_markers_test');
var Assert = require('assert');

class NoMarkersForCommitTest extends GetMarkersTest {

	getExpectedFields () {
		return {
			noMarkerLocationsForCommit: true
		};
	}

	get description () {
		return 'should return a flag indicating the stream has no marker locations for this commit when requesting same';
	}

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		queryParameters.commitHash = this.postFactory.randomCommitHash();
		return queryParameters;
	}

	validateResponse (data) {
		Assert(data.noMarkerLocationsForCommit, 'noMarkerLocationsForCommit is not true');
	}
}

module.exports = NoMarkersForCommitTest;

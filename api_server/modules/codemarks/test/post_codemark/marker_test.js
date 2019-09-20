'use strict';

const PostCodemarkTest = require('./post_codemark_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class MarkerTest extends PostCodemarkTest {

	get description () {
		return 'should return a valid codemark with marker data when creating an codemark tied to a third-party post, and including a marker';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.expectMarkers = 1;
			callback();
		});
	}

	getExpectedFields () {
		const expectedFields = DeepClone(super.getExpectedFields());
		expectedFields.codemark.push('markerIds');
		return expectedFields;
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.data.markers = this.markerFactory.createRandomMarkers(this.expectMarkers, { fileStreamId: this.repoStreams[0].id });
			callback();
		});
	}
}

module.exports = MarkerTest;

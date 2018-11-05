'use strict';

const PostCodeMarkTest = require('./post_codemark_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class MarkerTest extends PostCodeMarkTest {

	get description () {
		return 'should return a valid codemark with marker data when creating an codemark tied to a third-party post, and including a marker';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.expectMarker = true;
			callback();
		});
	}

	getExpectedFields () {
		const expectedFields = DeepClone(super.getExpectedFields());
		expectedFields.codemark.push('markerIds');
		return expectedFields;
	}

	makeCodeMarkData (callback) {
		super.makeCodeMarkData(() => {
			this.data.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
			callback();
		});
	}
}

module.exports = MarkerTest;

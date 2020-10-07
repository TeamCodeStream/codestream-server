'use strict';

const AddMarkersTest = require('./add_markers_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class MarkersTooLongTest extends AddMarkersTest {

	get description () {
		return 'should return an error when attempting to add markers to a codemark with a markers array that is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: array is too long'
		};
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// create an array of markers that is over the limit in size, by duplicating the marker
		super.makeTestData(() => {
			const marker = this.data.markers[0];
			for (let i = 0; i < 100; i++) {
				this.data.markers.push(DeepClone(marker));
			}
			callback();
		});
	}
}

module.exports = MarkersTooLongTest;

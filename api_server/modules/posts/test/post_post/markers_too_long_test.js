'use strict';

const ItemMarkerTest = require('./item_marker_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class MarkersTooLongTest extends ItemMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and item with a markers array that is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: array is too long'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// create an array of markers that is over the limit in size, by duplicating the marker
		super.makePostData(() => {
			const marker = this.data.item.markers[0];
			for (let i = 0; i < 10; i++) {
				this.data.item.markers.push(DeepClone(marker));
			}
			callback();
		});
	}
}

module.exports = MarkersTooLongTest;

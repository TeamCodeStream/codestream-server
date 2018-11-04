'use strict';

const MarkerTest = require('./marker_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class MarkersTooLongTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an item with a markers array that is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: array is too long'
		};
	}

	// form the data to use in trying to create the item
	makeItemData (callback) {
		// create an array of markers that is over the limit in size, by duplicating the marker
		super.makeItemData(() => {
			const marker = this.data.markers[0];
			for (let i = 0; i < 10; i++) {
				this.data.markers.push(DeepClone(marker));
			}
			callback();
		});
	}
}

module.exports = MarkersTooLongTest;

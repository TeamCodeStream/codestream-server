'use strict';

const MarkerTest = require('./marker_test');

class MarkerNotObjectTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create an item with a marker element that is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: element at [0-9]+ is not an object'
		};
	}

	// form the data to use in trying to create the item
	makeItemData (callback) {
		// we'll add a "numeric" code-block ... not allowed!
		super.makeItemData(() => {
			this.data.markers.push(1);
			callback();
		});
	}
}

module.exports = MarkerNotObjectTest;

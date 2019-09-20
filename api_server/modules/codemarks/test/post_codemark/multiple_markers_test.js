'use strict';

const MarkerTest = require('./marker_test');

class MultipleMarkersTest extends MarkerTest {

	get description () {
		return 'should be able to create a codemark with multiple markers';
	} 
	
	setTestOptions(callback) {
		super.setTestOptions(() => {
			this.expectMarkers = 3;
			callback();
		});
	}
}

module.exports = MultipleMarkersTest;

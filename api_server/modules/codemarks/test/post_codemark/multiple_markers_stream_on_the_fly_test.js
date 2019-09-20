'use strict';

const MarkerStreamOnTheFlyTest = require('./marker_stream_on_the_fly_test');

class MultipleMarkersStreamOnTheFlyTest extends MarkerStreamOnTheFlyTest {

	get description () {
		return 'should be able to create a codemark with multiple markers where the file stream for each will be created on the fly';
	} 
	
	setTestOptions(callback) {
		super.setTestOptions(() => {
			this.expectMarkers = 3;
			callback();
		});
	}
}

module.exports = MultipleMarkersStreamOnTheFlyTest;

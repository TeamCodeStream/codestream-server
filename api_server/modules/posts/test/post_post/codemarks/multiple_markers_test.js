'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class MultipleMarkersTest extends CodemarkMarkerTest {

	get description () {
		return 'should be able to create a post with a codemark with multiple markers';
	} 
	
	setTestOptions(callback) {
		super.setTestOptions(() => {
			this.expectMarkers = 3;
			this.expectStreamMarkers = 4;
			callback();
		});
	}
}

module.exports = MultipleMarkersTest;

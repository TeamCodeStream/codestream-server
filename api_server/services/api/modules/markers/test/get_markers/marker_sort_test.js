'use strict';

var GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var GetMarkersRequest = require('../../get_markers_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

const MARKER_LOCATIONS = {
	'a': [0, 5],
	'b': [4, 9],
	'c': [5, 7],
	'd': [7],
	'e': [1, 7],
	'f': [2],
	'g': [1, 2],
	'h': [7, 8],
	'i': [0],
	'j': [3, 11],
	'k': [0, 4],
	'l': [10, 12],
	'm': [6, 7],
};

const CORRECT_ASCENDING_ORDER = 'i,f,g,k,a,c,d,e,m,h,b,j,l';
const CORRECT_DESCENDING_ORDER = 'l,h,d,m,c,b,j,f,g,e,k,i,a';

class MarkerSortTest extends GenericTest {

	get description () {
		return `should properly sort markers in ${this.order} order by line`;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.setMarkerLocations,
			this.sortMarkers
		], callback);
	}

	setMarkerLocations (callback) {
		this.getMarkersRequest = new GetMarkersRequest({
			request: { user: {} }
		});
		this.getMarkersRequest.relational = this.order === 'ascending' ? 'gt' : 'lt';
		this.getMarkersRequest.markerLocations = MARKER_LOCATIONS;
		callback();
	}

	sortMarkers (callback) {
		this.getMarkersRequest.sortMarkers(callback);
	}

	run (callback) {
		let sortedIds = this.getMarkersRequest.sortedMarkers.map(marker => marker.markerId);
		let expectedOrder = this.order === 'ascending' ? CORRECT_ASCENDING_ORDER : CORRECT_DESCENDING_ORDER;
		expectedOrder = expectedOrder.split(',');
		Assert.deepEqual(expectedOrder, sortedIds, 'sort was not correct');
		callback();
	}
}

module.exports = MarkerSortTest;

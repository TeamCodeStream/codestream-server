'use strict';

var MarkerSortTest = require('./marker_sort_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

const CORRECT_ASCENDING_IDS = 'a,c,d,e,m';
const CORRECT_DESCENDING_IDS = 'j,f,g,e';

class SetIdsTest extends MarkerSortTest {

	get description () {
		return `should properly set marker IDs to fetch in ${this.order} order by line`;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setIds
		], callback);
	}

	setIds (callback) {
		this.getMarkersRequest.relationalValue = 4;
		this.getMarkersRequest.api = {
			config: { limits: { maxMarkersPerRequest: 3 } }
		};
		this.getMarkersRequest.setIds(callback);
	}

	run (callback) {
		let ids = this.getMarkersRequest.ids;
		let expectedIds = this.order === 'ascending' ? CORRECT_ASCENDING_IDS : CORRECT_DESCENDING_IDS;
		expectedIds = expectedIds.split(',');
		Assert.deepEqual(expectedIds, ids, 'ids not correct');
		Assert(this.getMarkersRequest.responseData.more === true, 'more is not set');
		callback();
	}
}

module.exports = SetIdsTest;

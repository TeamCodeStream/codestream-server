'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var CommonInit = require('./common_init');

class PutCalculateLocationsTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.numPosts = 10;
		this.numEdits = 20;
		this.path = '/calculate-locations';
	}

	get description () {
		return 'should calculate marker locations when requested';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate we got back marker locations for each marker, but we're not validating
	// the actual location calculations here
	validateResponse (data) {
		Assert(typeof data.markerLocations === 'object', 'did not get markerLocations in response');
		const markerLocations = data.markerLocations;
		Assert.equal(markerLocations.teamId, this.team._id, 'incorrect teamId');
		Assert.equal(markerLocations.streamId, this.stream._id, 'incorrect streamId');
		if (this.noNewCommitHash) {
			Assert(markerLocations.commitHash === undefined, 'commitHash is defined');
		}
		else {
			Assert.equal(markerLocations.commitHash, this.newCommitHash.toLowerCase(), 'incorrect commitHash');
		}
		Assert(typeof markerLocations.locations === 'object', 'did not get locations in response');
		let markerIds = Object.keys(markerLocations.locations);
		markerIds.sort();
		let myMarkerIds = Object.keys(this.locations);
		myMarkerIds.sort();
		Assert.deepEqual(myMarkerIds, markerIds, 'did not get expected markerIds in locations');
	}
}

module.exports = PutCalculateLocationsTest;

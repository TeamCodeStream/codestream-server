'use strict';

var GetMarkerLocationsTest = require('./get_marker_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACLStreamTest extends GetMarkerLocationsTest {

	get description () {
		return 'should return an error when trying to fetch marker locations from a stream i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// run the regular marker locations test
			this.createOtherStream	// now create a different stream
		], callback);
	}

	// create a channel stream that i'm not a member of
	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				// fetch marker locations for this stream
				this.path = `/marker-locations?teamId=${this.team._id}&streamId=${response.stream._id}&commitHash=${this.commitHash}`;
				callback();
			},
			{
				type: 'channel',
				token: this.otherUserData.accessToken,	 // the other user creates it
				teamId: this.repo.teamId
			}
		);
	}
}

module.exports = ACLStreamTest;

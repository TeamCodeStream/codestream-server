'use strict';

var PutCalculateLocationsTest = require('./put_marker_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACLStreamTest extends PutCalculateLocationsTest {

	get description () {
		return 'should return error when attempting to calculate marker locations for a stream i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'	// updateAUth
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// run the usual test of putting marker locations
			this.createOtherStream	// now create another stream as a different user, i won't be a member of this stream
		], callback);
	}

	// create a channel stream that i won't be a member of
	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.stream._id;
				callback();
			},
			{
				type: 'channel',
				teamId: this.team._id,
				token: this.otherUserData.accessToken	// other user is the creator, and it doesn't include me
			}
		);
	}
}

module.exports = ACLStreamTest;

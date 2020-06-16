'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ACLStreamTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations for a stream i am not a member of';
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
				this.data.streamId = response.stream.id;
				callback();
			},
			{
				type: 'channel',
				teamId: this.team.id,
				token: this.users[1].accessToken	// other user is the creator, and it doesn't include me
			}
		);
	}
}

module.exports = ACLStreamTest;

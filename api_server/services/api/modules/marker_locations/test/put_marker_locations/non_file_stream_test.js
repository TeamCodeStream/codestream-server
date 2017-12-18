'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NonFileStreamTest extends PutMarkerLocationsTest {

	get description () {
		return `should return error when attempting to put marker locations for a ${this.streamType} stream`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// set up the standard test conditions
			this.createOtherStream	// create another stream
		], callback);
	}

	// create aanother stream, we'll try to put marker locations to this stream instead
	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.stream._id;
				callback();
			},
			{
				type: this.streamType,
				withEmails: [this.currentUser.email], // this this user
				teamId: this.team._id,
				token: this.otherUserData.accessToken // other user is the creator
			}
		);
	}
}

module.exports = NonFileStreamTest;

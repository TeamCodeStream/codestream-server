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

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherStream
		], callback);
	}

	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.stream._id;
				callback();
			},
			{
				type: this.streamType,
				withEmails: [this.currentUser.email],
				teamId: this.team._id,
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = NonFileStreamTest;

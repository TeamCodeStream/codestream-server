'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NonFileStreamTest extends PutCalculateLocationsTest {

	get description () {
		return `should return error when attempting to calculate marker locations for a ${this.streamType} stream`;
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

	// create another stream, we'll try to put marker locations to this stream instead
	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.stream._id;
				callback();
			},
			{
				type: this.streamType,
				withEmails: [this.currentUser.email], // this user
				teamId: this.team._id,
				token: this.streamCreatorData.accessToken // stream creator creates another stream
			}
		);
	}
}

module.exports = NonFileStreamTest;

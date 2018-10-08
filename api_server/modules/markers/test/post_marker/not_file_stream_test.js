'use strict';

const PostMarkerTest = require('./post_marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NotFileStreamTest extends PostMarkerTest {

	get description () {
		return `should return an error when trying to create a marker referencing a ${this.streamType} stream`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	createFileStream (callback) {
		BoundAsync.series(this, [
			super.createFileStream,
			this.createNonFileStream
		], callback);
	}

	createNonFileStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				callback();
			},
			{
				teamId: this.team._id,
				type: this.streamType,
				token: this.otherUserData.accessToken
			}
		);
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// substitute the ID of the second stream (a non-file stream)
		super.makeMarkerData(() => {
			this.data.streamId = this.otherStream._id;
			callback();
		});
	}

}

module.exports = NotFileStreamTest;

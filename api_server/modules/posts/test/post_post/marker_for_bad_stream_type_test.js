'use strict';

const CodeMarkMarkerTest = require('./codemark_marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class MarkerForBadStreamTypeTest extends CodeMarkMarkerTest {

	get description () {
		return `should return an error when attempting to create a post and codemark with a marker element where the stream is of type ${this.streamType}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'marker stream must be a file-type stream'
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
				if (error) return callback(error);
				this.data.codemark.markers[0].fileStreamId = response.stream._id;
				callback();
			},
			{
				teamId: this.team._id,
				type: this.streamType,
				token: this.token
			}
		);
	}
}

module.exports = MarkerForBadStreamTypeTest;

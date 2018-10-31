'use strict';

const MarkerTest = require('./marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class MarkerForBadStreamTypeTest extends MarkerTest {

	get description () {
		return `should return an error when attempting to create a post with a marker element where the stream is of type ${this.streamType}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'only file type streams can have markers'
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
				this.data.markers[0].streamId = response.stream._id;
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

'use strict';

var GetMarkersTest = require('./get_markers_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACLStreamTest extends GetMarkersTest {

	get description () {
		return 'should return an error when trying to fetch markers from a stream i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
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
				this.path = `/markers?teamId=${this.team._id}&streamId=${response.stream._id}`;
				callback();
			},
			{
				type: 'channel',
				token: this.otherUserData.accessToken,
				teamId: this.repo.teamId
			}
		);
	}
}

module.exports = ACLStreamTest;

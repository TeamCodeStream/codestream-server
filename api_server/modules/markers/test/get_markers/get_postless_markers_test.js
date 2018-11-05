'use strict';

const GetMarkersTest = require('./get_markers_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class GetPostlessMarkersTest extends GetMarkersTest {

	constructor (options) {
		super(options);
		delete this.streamOptions.creatorIndex;
		delete this.postOptions.creatorIndex;
	}

	get description () {
		return 'should return the correct markers when requesting markers for a team and the markers are for third-party provider';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createMarkers,
			this.setMarkers,
			this.setPath
		], callback);
	}

	createMarkers (callback) {
		this.postData = [];
		BoundAsync.timesSeries(
			this,
			5,
			this.createMarker,
			callback
		);
	}

	createMarker (n, callback) {
		const data = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(data, {
			teamId: this.team._id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		data.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.postData.push({ 
					markers: [ response.markers[0] ],
					markerLocations: response.markerLocations
				});
				callback();
			}
		);
	}
}

module.exports = GetPostlessMarkersTest;

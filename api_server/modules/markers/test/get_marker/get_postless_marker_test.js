'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const MarkerTestConstants = require('../marker_test_constants');
const RandomString = require('randomstring');
const Assert = require('assert');

class GetPostlessMarkerTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the marker when requesting a postless marker created for a third-party provider';
	}

	getExpectedFields () {
		return { marker: MarkerTestConstants.EXPECTED_MARKER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createMarker
		], callback);
	}

	// create the marker to fetch
	createMarker (callback) {
		const data = this.makeMarkerData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/markers',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.marker = response.marker;
				this.path = '/markers/' + this.marker._id;
				callback();
			}
		);
	}

	// make the data for the marker to be created for the test
	makeMarkerData () {
		const data = this.markerFactory.getRandomCodeBlockData();
		Object.assign(data, {
			teamId: this.team._id,
			providerType: 'slack',
			postStreamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		return data;
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct marker, and that we only got sanitized attributes
		this.validateMatchingObject(this.marker._id, data.marker, 'marker');
		Assert.equal(this.marker.post, undefined, 'post in fetched marker is not undefined');
		this.validateSanitized(data.marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostlessMarkerTest;

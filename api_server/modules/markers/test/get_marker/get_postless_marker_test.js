'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
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
		// to create a marker associated with an codemark, we actually have to create the codemark
		const data = this.makeCodemarkData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.marker = response.markers[0];
				this.codemark = response.codemark;
				this.path = '/markers/' + this.marker.id;
				callback();
			}
		);
	}

	// make the data for the codemark to be created for the test
	makeCodemarkData () {
		const data = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		data.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
		return data;
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct marker, and that we only got sanitized attributes
		this.validateMatchingObject(this.marker.id, data.marker, 'marker');
		this.validateSanitized(data.marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate we also got the parent codemark, with only sanitized attributes
		this.validateMatchingObject(this.codemark.id, data.codemark, 'codemark');
		this.validateSanitized(data.codemark, MarkerTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);

		// we should NOT get a post, since we're using third-party posts
		Assert.equal(typeof data.post, 'undefined', 'post is not undefined');
	}
}

module.exports = GetPostlessMarkerTest;


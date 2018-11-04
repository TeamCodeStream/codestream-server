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
		// to create a marker associated with an item, we actually have to create the item
		const data = this.makeItemData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/items',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.marker = response.markers[0];
				this.item = response.item;
				this.path = '/markers/' + this.marker._id;
				callback();
			}
		);
	}

	// make the data for the item to be created for the test
	makeItemData () {
		const data = this.itemFactory.getRandomItemData();
		Object.assign(data, {
			teamId: this.team._id,
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
		this.validateMatchingObject(this.marker._id, data.marker, 'marker');
		this.validateSanitized(data.marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate we also got the parent item, with only sanitized attributes
		this.validateMatchingObject(this.item._id, data.item, 'item');
		this.validateSanitized(data.item, MarkerTestConstants.UNSANITIZED_ITEM_ATTRIBUTES);

		// we should NOT get a post, since we're using third-party posts
		Assert.equal(typeof data.post, 'undefined', 'post is not undefined');
	}
}

module.exports = GetPostlessMarkerTest;


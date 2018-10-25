'use strict';

const SetPostIdTest = require('./set_post_id_test');
const RandomString = require('randomstring');

class MarkerAlreadyHasPostIdTest extends SetPostIdTest {

	get description () {
		return 'should return an error when trying to update a marker with a post ID and the marker already has a post ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'marker already has a post ID'
		};
	}

	makePostlessMarkerData () {
		const data = super.makePostlessMarkerData();
		Object.assign(data, {
			providerType: 'slack',
			postId: RandomString.generate(10),
			postStreamId: RandomString.generate(10)
		});
		return data;
	}
}

module.exports = MarkerAlreadyHasPostIdTest;

// provide a factory for creating random reviews, for testing purposes

'use strict';

const RandomString = require('randomstring');

class RandomReviewFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// get some random codemark data
	getRandomReviewData (options = {}) {
		const data = {
			title: RandomString.generate(50),
			status: RandomString.generate(10),
			text: RandomString.generate(100)
		};
		if (options.wantMarkers) {
			data.markers = this.markerFactory.createRandomMarkers(options.wantMarkers, options);
		}
		return data;
	}
}

module.exports = RandomReviewFactory;

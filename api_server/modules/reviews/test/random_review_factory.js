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
			status: 'open',
			text: RandomString.generate(100),
			reviewChangesets: this.changesetFactory.getRandomChangesets(options.numChanges, options)
		};
		if (options.wantMarkers) {
			data.markers = this.markerFactory.createRandomMarkers(options.wantMarkers, options);
		}
		return data;
	}
}

module.exports = RandomReviewFactory;

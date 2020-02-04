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
			text: RandomString.generate(100),
			repoChangesets: this.getRandomChangesets(options)
		};
		if (options.wantMarkers) {
			data.markers = this.markerFactory.createRandomMarkers(options.wantMarkers, options);
		}
		return data;
	}

	// get a random change set for a code review
	getRandomChangesets (options = {}) {
		const numChanges = options.numChanges || 1;
		const changes = [];
		for (let i = 0; i < numChanges; i++) {
			const repoId = options.changesetRepoIds ? options.changesetRepoIds[i] : options.changesetRepoId;
			changes.push({
				repoId,
				branch: RandomString.generate(20)
			});
		}
		return changes;
	}
}

module.exports = RandomReviewFactory;

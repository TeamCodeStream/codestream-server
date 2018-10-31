// provide a factory for creating random markers, for testing purposes

'use strict';

const RandomString = require('randomstring');

class RandomItemFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// get some random item data
	getRandomItemData (options = {}) {
		const data = {
			title: RandomString.generate(50),
			type: options.itemType || RandomString.generate(10),
			status: RandomString.generate(10),
			color: RandomString.generate(10),
			text: RandomString.generate(100)
		};
		if (options.wantMarkers) {
			data.markers = this.markerFactory.createRandomMarkers(options.wantMarkers, options);
		}
		return data;
	}
}

module.exports = RandomItemFactory;

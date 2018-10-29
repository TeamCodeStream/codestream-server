// provide a factory for creating random markers, for testing purposes

'use strict';

const RandomString = require('randomstring');

class RandomItemFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// get some random item data
	getRandomItemData (options = {}) {
		return {
			title: RandomString.generate(50),
			type: options.type || RandomString.generate(10),
			status: RandomString.generate(10),
			color: RandomString.generate(10),
			text: RandomString.generate(100)
		};
	}
}

module.exports = RandomItemFactory;

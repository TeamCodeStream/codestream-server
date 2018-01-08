'use strict';

var RandomString = require('randomstring');

class RandomTeamFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	randomName () {
		return 'team ' + RandomString.generate(12);
	}
}

module.exports = RandomTeamFactory;

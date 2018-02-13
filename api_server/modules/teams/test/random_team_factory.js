// provide a factory for creating random teams, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomTeamFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// return a random team name
	randomName () {
		return 'team ' + RandomString.generate(12);
	}
}

module.exports = RandomTeamFactory;

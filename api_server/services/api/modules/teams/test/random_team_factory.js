'use strict';

var Random_String = require('randomstring');

class Random_Team_Factory {

	constructor (options) {
		Object.assign(this, options);
	}

	random_name () {
		return 'team ' + Random_String.generate(12);
	}
}

module.exports = Random_Team_Factory;

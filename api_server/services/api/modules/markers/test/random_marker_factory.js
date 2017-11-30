'use strict';

var RandomString = require('randomstring');

class RandomMarkerFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	randomUpto (upto) {
		return Math.floor(Math.random() * upto);
	}

	randomCommitHash () {
		return RandomString.generate(40);
	}

	randomLocation () {
		let location = [];
		let lineStart = this.randomUpto(1000);
		location.push(lineStart);
		let lineEnd;
		if (Math.random() < 0.2) {
			return location; // simulates a single line selected
		}
		else if (Math.random() < 0.2) {
			lineEnd = lineStart; // simulates a single line selected
		}
		else {
			lineEnd = lineStart + this.randomUpto(1000);
		}
		location.push(lineEnd);
		if (Math.random() < 0.4) {
			return location; // simulates a range of lines selected, but no columns
		}
		const charStart = this.randomUpto(100);
		const charEnd = (lineStart === lineEnd) ?
			(charStart + this.randomUpto(100)) :
			this.randomUpto(100);
		location.push(charStart);
		location.push(charEnd);
		return location;
	}

	getRandomMarkerData (callback) {
		let data = {
			location: this.randomLocation(),
		};
		callback(null, data);
	}
}

module.exports = RandomMarkerFactory;

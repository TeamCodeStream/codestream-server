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
		let lineStart, lineEnd, charStart, charEnd, fifthElement = {};
		lineStart = this.randomUpto(1000);
		if (Math.random() < 0.2) {
			lineEnd = lineStart; // simulates a single line selected
		}
		else {
			lineEnd = lineStart + this.randomUpto(1000);
		}
		if (Math.random() < 0.4) {
			charStart = 0;
			charEnd = 100; // as best as we can, simulates a range of lines selected, but no columns
		}
		else {
			charStart = this.randomUpto(100);
			charEnd = (lineStart === lineEnd) ?
				(charStart + this.randomUpto(100)) :
				this.randomUpto(100);
		}
		if (Math.random() < 0.1) {
			fifthElement.startWasDeleted = true;
		}
		if (Math.random() < 0.1) {
			fifthElement.endWasDeleted = true;
		}
		let location = [lineStart, charStart, lineEnd, charEnd];
		if (Object.keys(fifthElement).length) {
			location.push(fifthElement);
		}
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

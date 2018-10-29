// provide a factory for creating random markers, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomMarkerFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// get a random positive integer in a range from 0 to "upto"
	randomUpto (upto) {
		return Math.floor(Math.random() * upto);
	}

	// generate a random commit hash
	randomCommitHash () {
		// we're pretty lax here, just create a random 40-character string,
		// won't really look too much like an actual git commit hash, but it
		// shouldn't matter
		return RandomString.generate(40);
	}

	// create a random location array, following several randomly induced scenarios
	// lineStart, columnStart, lineEnd, columnEnd ... and a fifth element for additional information
	randomLocation () {
		let lineStart, lineEnd, charStart, charEnd, fifthElement = {};
		lineStart = 1 + this.randomUpto(1000);
		if (Math.random() < 0.2) {
			lineEnd = lineStart; // simulates a single line selected
		}
		else {
			lineEnd = lineStart + this.randomUpto(1000);
		}
		if (Math.random() < 0.4) {
			charStart = 1;
			charEnd = 100; // as best as we can, simulates a range of lines selected, but no columns
		}
		else {
			charStart = 1 + this.randomUpto(100);
			charEnd = (lineStart === lineEnd) ?
				(charStart + this.randomUpto(100)) :
				this.randomUpto(100);
		}
		if (Math.random() < 0.1) {
			// indicates the location of the start of this marker was deleted for this commit
			fifthElement.startWasDeleted = true;
		}
		if (Math.random() < 0.1) {
			// indicates the location of the end of this marker was deleted for this commit
			fifthElement.endWasDeleted = true;
		}
		let location = [lineStart, charStart, lineEnd, charEnd];
		if (Object.keys(fifthElement).length) {
			// the "fifth element" contains additional info beside the coordinates
			location.push(fifthElement);
		}
		return location;
	}

	// get several random lines of text, just garbage
	randomLinesOfText (n) {
		let lines = [];
		for (let i = 0; i < n; i++) {
			lines.push(RandomString.generate(80));
		}
		return lines;
	}

	// get a simlulated series of edits, which is what is passed to calculate-markers,
	// originating from a git diff
	randomEdits (numEdits) {
		let edits = [];
		let balance = 0;
		let last = 0;
		for (let i = 0; i < numEdits; i++) {
			let delLength = this.randomUpto(10);
			let addLength = this.randomUpto(10);
			let delStart = last + 1 + this.randomUpto(100);
			let addStart = delStart + balance;
			balance += addLength - delLength;
			last = delStart;
			let adds = this.randomLinesOfText(addLength);
			let dels = this.randomLinesOfText(delLength);
			edits.push({ delStart, delLength, addStart, addLength, adds, dels });
		}
		return edits;
	}

	// get some random marker data
	getRandomMarkerData () {
		return {
			location: this.randomLocation(),
		};
	}

	// get some random code block data
	getRandomCodeBlockData () {
		return {
			code: RandomString.generate(1000),
			commitHash: this.repoFactory.randomCommitHash(),
			location: this.randomLocation(),
			file: this.streamFactory.randomFile(),
			remotes: [ this.repoFactory.randomUrl() ]
		};
	}
}

module.exports = RandomMarkerFactory;

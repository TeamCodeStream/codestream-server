'use strict';

const ReactTest = require('./react_test');

class IllegalCharacterTest extends ReactTest {

	get description () {
		return `should return an error when trying to react to a post with a reaction containing a ${this.character} character`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'reactions can not contain'
		};
	}

	// form the data for the reaction
	makePostData (callback) {
		// add an illegal character to the reaction key
		super.makePostData(error => {
			if (error) { return callback(error); }
			delete this.data[this.reaction];
			this.reaction += this.character;
			this.data[this.reaction] = true;
			callback();
		});
	}
}

module.exports = IllegalCharacterTest;

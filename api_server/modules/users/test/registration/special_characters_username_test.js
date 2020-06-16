'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

// from username_validator.js
const SPECIAL_CHARACTERS = '-._();\'[]{},/àéíóūñ६¾管理員';

class SpecialCharactersUsernameTest extends RegistrationTest {

	get description () {
		return 'certain non-alphanumeric characters should be ok for usernames';
	}

	before (callback) {
		super.before(error => {
			// generate random user data, but a username with a bad character
			if (error) { return callback(error); }
			this.data.username = RandomString.generate(12) + SPECIAL_CHARACTERS;
			callback();
		});
	}
}

module.exports = SpecialCharactersUsernameTest;

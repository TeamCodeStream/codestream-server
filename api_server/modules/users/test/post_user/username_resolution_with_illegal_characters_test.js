'use strict';

const PostUserTest = require('./post_user_test');
const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const RandomString = require('randomstring');

class UsernameResolutionWithIllegalCharactersTest extends PostUserTest {

	get description () {
		return 'when inviting a new user, and the first part of the user\'s email has characters that are not allowed for a username, the username bad characters should be removed from the default username';
	}

	// form the data for the user update
	makeUserData (callback) {
		// substitute an email matching an existing user's username
		super.makeUserData(() => {
			const domain = EmailUtilities.parseEmail(this.data.email).domain;
			const part1 = `_${RandomString.generate(3)}`;
			const part2 = `-${RandomString.generate(3)}`;
			const part3 = `.${RandomString.generate(3)}`;
			const firstPartOfEmail = `#${part1}%${part2}&${part3}?`;			
			this.data.email = `${firstPartOfEmail}@${domain}`;
			this.expectedUsername = `${part1}${part2}${part3}`;
			callback();
		});
	}
}

module.exports = UsernameResolutionWithIllegalCharactersTest;

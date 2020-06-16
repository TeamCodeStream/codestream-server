// handles username validation and normalization, this way, we keep the rules for usernames
// in one place ... less fragile

const XRegExp = require('xregexp');

const ALLOWED_CHARACTERS = '\\p{L}\\p{N}_\\-\\.;\',\\/\\(\\)\\[\\]\\{\\}';

module.exports = {


	// validate this username by testing against allowed characters
	validate: function (username) {
		const regexp = new XRegExp(`^[${ALLOWED_CHARACTERS}]+$`);
		return regexp.test(username);
	},

	// given a username, remove any disallowed characters
	normalize: function (username) {
		const regexp = new XRegExp(`([^${ALLOWED_CHARACTERS}]+)`, 'g');
		return username.replace(regexp, '');
	}

};

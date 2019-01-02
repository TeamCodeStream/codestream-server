// handles username validation and normalization, this way, we keep the rules for usernames
// in one place ... less fragile

const ALLOWED_UPPER = 'A-Z';
const ALLOWED_LOWER = 'a-z0-9-._\\(\\);\'\\[\\]\\{\\},\\/';
const ALLOWED_CHARACTERS = `${ALLOWED_UPPER}${ALLOWED_LOWER}`;

module.exports = {


	// validate this username by testing against allowed characters
	validate: function (username, lowercaseOnly) {
		const upper = lowercaseOnly ? '' : ALLOWED_UPPER;
		const regexp = new RegExp(`^[${upper}${ALLOWED_LOWER}]+$`);
		return regexp.test(username);
	},

	// given a username, remove any disallowed characters
	normalize: function (username) {
		const regexp = new RegExp(`([^${ALLOWED_CHARACTERS}]+)`, 'g');
		return username.replace(regexp, '');
	}

};

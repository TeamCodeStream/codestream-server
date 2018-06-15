// these database indexes are in place for the signup_tokens collection for the users module

'use strict';

module.exports = {
	byToken: {
		token: 1
	},
	byExpiresAt: {
		expiresAt: 1
	}
};

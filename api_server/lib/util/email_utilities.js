'use strict';

module.exports = {

	parse_email (email) {
		if (typeof email !== 'string') {
			return 'email must be string';
		}
		var parts = email.split('@');
		if (parts.length !== 2) {
			return 'invalid email';
		}
		var domain_parts = parts[1].split('.');
		if (domain_parts.length < 1) {
			return 'invalid domain';
		}
		return {
			email: email,
			name: parts[0],
			domain: parts[1],
			tld: parts[parts.length - 1]
		};
	}

};

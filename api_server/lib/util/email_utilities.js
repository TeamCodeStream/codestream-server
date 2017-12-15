// provides any miscellanous functions having to do with emails

'use strict';

module.exports = {

	// parse an email address and separate into parts
	parseEmail (email) {
		if (typeof email !== 'string') {
			return 'email must be string';
		}
		let parts = email.split('@');
		if (parts.length !== 2) {
			return 'invalid email';
		}
		let domainParts = parts[1].split('.');
		if (domainParts.length < 1) {
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

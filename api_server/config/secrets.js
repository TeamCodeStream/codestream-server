'use strict';

module.exports = {
	secret: process.env.CI_API_SECRET,
	auth: process.env.CI_API_AUTH_SECRET
};

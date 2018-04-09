// generate a JSON web token to use as an access token

'use strict';

const JSONWebToken = require('jsonwebtoken');

module.exports = (user, secret) => {
	const payload = {
		userId: user._id.toString()
	};
	return JSONWebToken.sign(payload, secret);
};

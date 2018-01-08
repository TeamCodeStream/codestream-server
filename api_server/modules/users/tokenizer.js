'use strict';

var JSONWebToken = require('jsonwebtoken');

module.exports = (user, secret, callback) => {
	let payload = {
		userId: user._id.toString()
	};
	JSONWebToken.sign(
		payload,
		secret,
		{},
		callback
	);
};

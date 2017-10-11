'use strict';

var JSON_Web_Token = require('jsonwebtoken');

module.exports = (user, secret, callback) => {
	let payload = {
		user_id: user._id.toString()
	};
	JSON_Web_Token.sign(
		payload,
		secret,
		{},
		callback
	);
};

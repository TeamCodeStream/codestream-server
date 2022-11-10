// handles encrypting a user's password

'use strict';

const Crypto = require('crypto');
const RandomString = require('randomstring');

class PasswordEncrypt {

	constructor (key) {
		this._key = key;
	}

	encryptPassword (password) {
		const iv = RandomString.generate(16);
		const cipher = Crypto.createCipheriv('aes-256-cbc', this._key, iv);
		let crypted = cipher.update(password, 'utf8', 'hex');
		crypted += cipher.final('hex');
		return `${crypted}.${iv}`;
	};
	
	decryptPassword = (encryptedPassword) => {
		const [password, iv] = encryptedPassword.split('.');
		const decipher = Crypto.createDecipheriv('aes-256-cbc', this._key, iv);
		var decrypted = decipher.update(password, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	}
}

module.exports = PasswordEncrypt;

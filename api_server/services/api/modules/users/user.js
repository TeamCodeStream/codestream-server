'use strict';

var CodeStream_Model = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var User_Validator = require('./user_validator');

class User extends CodeStream_Model {

	get_validator () {
		return new User_Validator();
	}

	pre_save (callback, options) {
		this.attributes.searchable_email = this.attributes.email.toLowerCase();
		if (this.attributes.username) {
			this.attributes.searchable_username = this.attributes.username.toLowerCase();
		}
		super.pre_save(callback, options);
	}
}

module.exports = User;

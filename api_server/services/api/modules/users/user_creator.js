'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var User_Validator = require('./user_validator');
var User = require('./user');
var BCrypt = require('bcrypt');

class User_Creator extends Model_Creator {

	get model_class () {
		return User;
	}

	get collection_name () {
		return 'users';
	}

	create_user (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	validate_attributes (callback) {
		this.user_validator = new User_Validator();
		var required_attributes = ['emails', 'password', 'username'];
		var error =
			this.check_required(required_attributes) ||
			this.validate_email() ||
			this.validate_password() ||
			this.validate_username();
		callback(error);
	}

	validate_email () {
		var error = this.user_validator.validate_array_of_emails(this.attributes.emails);
		if (error) {
		 	return { email: error };
	 	}
	}

	validate_password () {
		var error = this.user_validator.validate_password(this.attributes.password);
		if (error) {
			return { password: error };
		}
	}

	validate_username () {
		var error = this.user_validator.validate_username(this.attributes.username);
		if (error) {
		 	return { username: error };
	 	}
	}

	check_existing_query () {
		var lowercase_emails = this.attributes.emails.map(email => email.toLowerCase());
		return {
			searchable_emails: { $in: lowercase_emails },
			deactivated: false
		};
	}

	pre_save (callback) {
		Bound_Async.series(this, [
			this.generate_salt,
			this.hash_password
		], (error) => {
			if (error) { return callback(error); }
			super.pre_save(callback);
		});
	}

	generate_salt (callback) {
		BCrypt.genSalt(
			10,
			(error, salt) => {
				if (error) {
					return callback(this.error_handler.error('token', { reason: error }));
				}
				this.salt = salt;
				callback();
			}
		);
	}

	hash_password (callback) {
		BCrypt.hash(
			this.attributes.password,
			this.salt,
			(error, password_hash) => {
				if (error) {
					return callback(this.error_handler.error('token', { reason: error }));
				}
				this.attributes.password_hash = password_hash;
				delete this.attributes.password;
				process.nextTick(callback);
			}
		);
	}

	create (callback) {
		this.model.attributes._id = this.model.attributes.creator_id = this.collection.create_id();
		super.create(callback);
	}
}

module.exports = User_Creator;

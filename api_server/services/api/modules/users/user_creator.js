'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var User_Validator = require('./user_validator');
var User = require('./user');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
var Password_Hasher = require('./password_hasher');

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

	get_required_attributes () {
		return ['email'];
	}

	validate_attributes (callback) {
		this.user_validator = new User_Validator();
		let error =
			this.validate_email() ||
			this.validate_password() ||
			this.validate_username();
		callback(error);
	}

	validate_email () {
		let error = this.user_validator.validate_email(this.attributes.email);
		if (error) {
		 	return { email: error };
	 	}
	}

	validate_password () {
		if (!this.attributes.password) { return; }
		let error = this.user_validator.validate_password(this.attributes.password);
		if (error) {
			return { password: error };
		}
	}

	validate_username () {
		if (!this.attributes.username) { return; }
		let error = this.user_validator.validate_username(this.attributes.username);
		if (error) {
		 	return { username: error };
	 	}
	}

	allow_attributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['email', 'password', 'username', 'first_name', 'last_name', 'confirmation_code'],
				number: ['confirmation_attempts', 'confirmation_code_expires_at'],
				boolean: ['is_registered'],
				'array(string)': ['secondary_emails']
			}
		);
		process.nextTick(callback);
	}

	model_can_exist () {
		return this.ok_if_exists;
	}

	check_existing_query () {
		return {
			searchable_email: this.attributes.email.toLowerCase(),
			deactivated: false
		};
	}

	pre_save (callback) {
		Bound_Async.series(this, [
			this.hash_password,
			super.pre_save
		], callback);
	}

	hash_password (callback) {
		if (!this.attributes.password) { return callback(); }
		new Password_Hasher({
			error_handler: this.error_handler,
			password: this.attributes.password
		}).hash_password((error, password_hash) => {
			if (error) { return callback(error); }
			this.attributes.password_hash = password_hash;
			delete this.attributes.password;
			process.nextTick(callback);
		});
	}

	create (callback) {
		this.model.attributes._id = this.collection.create_id();
		if (this.user) {
			this.model.attributes.creator_id = this.user.id;
		}
		else {
			this.model.attributes.creator_id = this.model.attributes._id;
		}
		super.create(callback);
	}
}

module.exports = User_Creator;

'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Random_String = require('randomstring');
const Secrets_Config = require(process.env.CS_API_TOP + '/config/secrets.js');

class _User_Creator {

	constructor (factory) {
		this.factory = factory;
	}

	create_user (data, callback) {
		this.data = data;
		Bound_Async.series(this, [
			this._register_user,
			this._confirm_user
		], (error) => {
			callback(
				error,
				{
					user: this.user,
					access_token: this.token
				}
			);
		});
	}

	_register_user (callback) {
		this.factory.api_requester.do_api_request(
			{
				method: 'post',
				path: '/no-auth/register',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				callback(null, { user: this.user });
			}
		);
	}

	register_user (data, callback) {
		this.data = data;
		this._register_user(callback);
	}

	_confirm_user (callback) {
		let data = {
			user_id: this.user._id,
			email: this.user.emails[0],
			confirmation_code: this.user.confirmation_code
		};
		this.factory.api_requester.do_api_request(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.token = response.access_token;
				callback();
			}
		);
	}
}

class Random_User_Factory {

	constructor (options) {
		Object.assign(this, options);
	}

	random_email () {
		return `somebody.${Random_String.generate(12)}@${Random_String.generate(12)}.com`;
	}

	get_random_user_data (options = {}) {
		let emails = [this.random_email()];
		let first_name = Random_String.generate(10);
		let last_name = Random_String.generate(10);
		let timeout = options.timeout || null;
		let _confirmation_cheat = Secrets_Config.confirmation_cheat;
		let _force_confirmation = 1;
		let data = { emails, first_name, last_name, timeout, _confirmation_cheat, _force_confirmation };
		if (!options.no_password) {
			data.password = Random_String.generate(12);
		}
		if (!options.no_username) {
			data.username = Random_String.generate(12);
		}
		Object.assign(data, options.with || {});
		return data;
	}

	create_user (data, callback) {
		new _User_Creator(this).create_user(data, callback);
	}

	create_random_user (callback, options = {}) {
		let data = this.get_random_user_data(options);
		if (options.no_confirm) {
			new _User_Creator(this).register_user(data, callback);
		}
		else {
			new _User_Creator(this).create_user(data, callback);
		}
	}

	register_random_user (callback, options = {}) {
		let data = this.get_random_user_data(options);
		new _User_Creator(this).register_user(data, callback);
	}

	create_random_nth_user (n, callback, options = {}) {
		this.create_random_user(callback, options);
	}

	create_random_users (howmany, callback, options = {}) {
		Bound_Async.times(
			this,
			howmany,
			(n, times_callback) => {
				this.create_random_nth_user(n, times_callback, options);
			},
			callback
		);
	}
}

module.exports = Random_User_Factory;

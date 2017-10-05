'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Random_String = require('randomstring');

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

	create_user (data, callback) {
		new _User_Creator(this).create_user(data, callback);
	}

	random_email () {
		return `somebody.${Random_String.generate(12)}@${Random_String.generate(12)}.com`;
	}

	get_random_user_data (options = {}) {
		let emails = [this.random_email()];
		let password = Random_String.generate(12);
		let username = Random_String.generate(12);
		let first_name = Random_String.generate(10);
		let last_name = Random_String.generate(10);
		let timeout = options.timeout || null;
		return { emails, password, username, first_name, last_name, timeout };
	}

	create_random_user (callback, options) {
		var data = this.get_random_user_data(options);
		this.create_user(data, callback);
	}

	register_random_user (callback, options) {
		let data = this.get_random_user_data(options);
		new _User_Creator(this).register_user(data, callback);
	}

	create_random_nth_user (n, callback) {
		this.create_random_user(callback);
	}

	create_random_users (howmany, callback) {
		Bound_Async.times(
			this,
			howmany,
			this.create_random_nth_user,
			callback
		);
	}

	create_random_coworkers (howmany, company_name, callback) {
		Bound_Async.timesSeries(
			this,
			howmany,
			(n, callback) => {
				this.create_random_user(callback, { company_name: company_name });
			},
			callback
		);
	}
}

module.exports = Random_User_Factory;

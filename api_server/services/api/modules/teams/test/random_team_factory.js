'use strict';

var Random_String = require('randomstring');

class Random_Team_Factory {

	constructor (options) {
		Object.assign(this, options);
	}

	create_team (data, token, callback) {
		this.api_requester.do_api_request({
			method: 'post',
			path: '/team',
			data: data,
			token: token
		}, callback);
	}

	random_name () {
		return 'team ' + Random_String.generate(12);
	}

	get_random_team_data (callback, options = {}) {
		let company_name = options.org ?
			options.org.git_owner :
			Random_String.generate(12);
		this.user_factory.create_random_coworkers(
			5,
			company_name,
			(error, users_data) => {
				if (error) { return callback(error); }
				let users = users_data.map(user_data => user_data.user);
				users.splice(3, 1);
				let data = {
					member_ids: users.map(user => user._id)
				};
				if (options.org) {
					data.org_id = options.org._id;
				}
				else {
					data.org_id = users[0].org_ids[0];
				}
				if (options.name) {
					data.name = options.name;
				}
				else if (options.random_name) {
					data.name = this.random_name();
				}
				return callback(null, users_data, data);
			}
		);
	}

	create_random_team (callback, options = {}) {
		this.get_random_team_data(
			(error, users_data, data) => {
				if (error) { return callback(error); }
				this.create_team(data, options.token || users_data[0].access_token, callback);
			},
			options
		);
	}
}

module.exports = Random_Team_Factory;

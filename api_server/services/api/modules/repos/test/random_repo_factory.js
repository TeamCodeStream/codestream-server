'use strict';

var Random_String = require('randomstring');

class Random_Repo_Factory {

	constructor (options) {
		Object.assign(this, options);
	}

	create_repo (data, token, callback) {
		this.api_requester.do_api_request({
			method: 'post',
			path: '/repos',
			data: data,
			token: token
		}, callback);
	}

	random_url () {
		return `https://${Random_String.generate(6)}.${Random_String.generate(6)}.com`;
	}

	random_sha () {
		return Random_String.generate(40);
	}

	get_random_repo_data (callback, options = {}) {
		let data = {
			url: this.random_url(),
			first_commit_sha: this.random_sha()
		};
		let emails;
		if (options.with_emails) {
			emails = options.with_emails;
		}
		if (options.with_random_emails) {
			emails = (emails || []).concat(
				this.get_n_random_emails(options.with_random_emails)
			);
		}
		if (options.team_id) {
			data.team_id = options.team_id;
			if (emails) {
				data.emails = emails;
			}
		}
		else if (options.team) {
			data.team = options.team;
		}
		else {
			data.team = {
				name: this.team_factory.random_name()
			};
			if (emails) {
				data.team.emails = emails;
			}
		}
		return callback(null, data);
	}

	get_n_random_emails (n) {
		let emails = [];
		for (let i = 0; i < n; i++) {
			emails.push(this.user_factory.random_email());
		}
		return emails;
	}

	create_random_repo (callback, options = {}) {
		this.get_random_repo_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.create_repo(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = Random_Repo_Factory;

'use strict';

var RandomString = require('randomstring');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class RandomRepoFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	createRepo (data, token, callback) {
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/repos',
			data: data,
			token: token
		}, callback);
	}

	randomUrl () {
		return `https://user@${RandomString.generate(6)}.${RandomString.generate(6)}.com/${RandomString.generate(8)}/${RandomString.generate(4)}?x=1&y=2#xyz`;
	}

	randomCommitHash () {
		return RandomString.generate(40);
	}

	getRandomRepoData (callback, options = {}) {
		let data = {
			url: this.randomUrl(),
			firstCommitHash: this.randomCommitHash()
		};
		let emails, users;
		if (options.withEmails) {
			emails = options.withEmails;
		}
		if (options.withRandomEmails) {
			emails = (emails || []).concat(
				this.getNRandomEmails(options.withRandomEmails)
			);
		}
		if (options.withUsers) {
			users = options.withUsers;
		}
		if (options.withRandomUsers) {
			users = (users || []).concat(
				this.getNRandomUsers(options.withRandomUsers)
			);
		}
		if (options.subscriptionCheat) {
			// allows unregistered users to subscribe to me-channel, needed for mock email testing
			data._subscriptionCheat = SecretsConfig.subscriptionCheat;
		}
		if (options.teamId) {
			data.teamId = options.teamId;
			if (emails) {
				data.emails = emails;
			}
			if (users) {
				data.users = users;
			}
		}
		else if (options.team) {
			data.team = options.team;
		}
		else {
			data.team = {
				name: this.teamFactory.randomName()
			};
			if (emails) {
				data.team.emails = emails;
			}
			if (users) {
				data.team.users = users;
			}
		}
		return callback(null, data);
	}

	getNRandomEmails (n) {
		let emails = [];
		for (let i = 0; i < n; i++) {
			emails.push(this.userFactory.randomEmail());
		}
		return emails;
	}

	getNRandomUsers (n) {
		let users = [];
		for (let i = 0; i < n; i++) {
			users.push({
				email: this.userFactory.randomEmail(),
				firstName: RandomString.generate(8),
				lastName: RandomString.generate(8)
			});
		}
	}

	createRandomRepo (callback, options = {}) {
		this.getRandomRepoData(
			(error, data) => {
				if (error) { return callback(error); }
				this.createRepo(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = RandomRepoFactory;

'use strict';

var RandomString = require('randomstring');

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
		return `https://${RandomString.generate(6)}.${RandomString.generate(6)}.com`;
	}

	randomSha () {
		return RandomString.generate(40);
	}

	getRandomRepoData (callback, options = {}) {
		let data = {
			url: this.randomUrl(),
			firstCommitSha: this.randomSha()
		};
		let emails;
		if (options.withEmails) {
			emails = options.withEmails;
		}
		if (options.withRandomEmails) {
			emails = (emails || []).concat(
				this.getNRandomEmails(options.withRandomEmails)
			);
		}
		if (options.teamId) {
			data.teamId = options.teamId;
			if (emails) {
				data.emails = emails;
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

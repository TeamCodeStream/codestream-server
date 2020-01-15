// provide a factory for creating random teams, for testing purposes

'use strict';

const RandomString = require('randomstring');

class TeamFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the team by submitting a request to the server
	async createTeam (data, token) {
		return this.apiRequester.doApiRequest({
			method: 'post',
			path: '/teams',
			data: data,
			token: token
		});
	}

	// return a random team name
	randomName () {
		return 'team ' + RandomString.generate(12);
	}

	// get some random attributes to create a random team
	getRandomTeamData () {
		return {
			name: this.randomName()
		};
	}

	// create a random team in the database
	async createRandomTeam (options = {}) {
		const data = this.getRandomTeamData();
		return this.createTeam(data, options.token);
	}
}

module.exports = TeamFactory;

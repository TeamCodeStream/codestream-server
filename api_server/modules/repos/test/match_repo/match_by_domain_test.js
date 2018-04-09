// base class for match-repo units tests

'use strict';

const MatchRepoTest = require('./match_repo_test');
const RandomString = require('randomstring');

class MatchByDomainTest extends MatchRepoTest {

	constructor (options) {
		super(options);
		this.numTeams = 3;
		this.numReposPerTeam = 3;
		delete this.service;
		delete this.org;
		this.domain = `${RandomString.generate(8)}.com`;
		this.matches = [0, 1, 5];
	}

	get description () {
		return 'should return the expected info when matching repos by domain';
	}
}

module.exports = MatchByDomainTest;

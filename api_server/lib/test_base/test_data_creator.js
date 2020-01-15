'use strict';

class TestDataCreator {

	constructor (options = {}) {
		Object.assign(this, options);
		this.data = {
			users: [],
			registeredUsers: [],
			unregisteredUsers: [],
			teams: []
		};
	}

	/*
	BoundAsync.series(this, [
			this.createRegisteredUsers,
			this.createUnregisteredUsers,
			this.preCreateTeam,
			this.createTeam,
			this.inviteUsers,
			this.createRepo
		], error => {
			if (error) { return callback(error); }
			callback(null, {
				team: this.team,
				company: this.company,
				teamStream: this.teamStream,
				repo: this.repo,
				repoStreams: this.repoStreams,
				repoPost: this.repoPost,
				repoCodemark: this.repoCodemark,
				repoMarker: this.repoMarker,
				users: this.users,
				currentUser: this.currentUser,
				token: this.token
			});
		});
	}
	*/

	async create () {
		await this.createRegisteredUsers();
		await this.createUnregisteredUsers();
		await this.createTeams();
		await this.inviteUsers();
		//await this.createRepos();
		return this.data;
	}

	async createRegisteredUsers () {
		for (let i = 0; i < 15; i++) {
			await this.createRegisteredUser();
		}
	}

	async createRegisteredUser () {
		const data = this.test.userFactory.getRandomUserData();
		const userData = await this.test.userFactory.createUser(data);
		userData.password = data.password;
		this.data.registeredUsers.push(userData);
		this.data.users.push(userData);
	}

	async createUnregisteredUsers () {
		for (let i = 0; i < 15; i++) {
			await this.createUnregisteredUser();
		}
	}

	async createUnregisteredUser () {
		const data = this.test.userFactory.getRandomUserData();
		const userData = await this.test.userFactory.registerUser(data);
		this.data.unregisteredUsers.push(userData);
		this.data.users.push(userData);
	}

	async createTeams () {
		await this.createTeam(0);
		await this.createTeam(10);
	}

	async createTeam (nUser) {
		const creator = this.data.registeredUsers[nUser];
		const token = creator.accessToken;
		const response = await this.test.teamFactory.createRandomTeam({ token });
		this.data.teams.push({
			team: response.team,
			company: response.company,
			teamStream: response.streams[0],
			creator
		});
	}

	async inviteUsers () {
		for (let nTeam = 0; nTeam < 2; nTeam++) {
			for (let nUser = nTeam * 5 + 1; nUser < nTeam * 5 + 5; nUser++) {
				await this.inviteUser(nTeam, nUser);
			}
			for (let i = 0; i < 3; i++) {
				const email = this.test.userFactory.randomEmail();
				await this.inviteUser(nTeam, null, email);
			}
		}
	}

	async inviteUser (nTeam, nUser, email) {
		const teamData = this.data.teams[nTeam];
		const team = teamData.team;
		const user = nUser !== null ? this.data.users[nUser].user : null;
		const token = teamData.creator.accessToken;
		const response = await this.test.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: email || user.email,
					teamId: team.id,
					_pubnubUuid: this.test.userFactory.getNextPubnubUuid()
				},
				token
			}
		);
		const invitedUser = response.user;
		team.memberIds.push(invitedUser.id);
		if (email) {
			this.data.unregisteredUsers.push(invitedUser);
			this.data.users.push(invitedUser);
		}
	}

	/*
	createRepo (callback) {
		if (
			!this.repoOptions || 
			(
				typeof this.repoOptions.creatorIndex !== 'number' && 
				!this.repoOptions.creatorToken
			)
		) {
			return callback();
		}	
		const token = this.repoOptions.creatorToken || this.users[this.repoOptions.creatorIndex].accessToken;
		this.test.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repos[0];
				this.repoStreams = response.streams;
				this.repoPost = response.post;
				this.repoCodemark = response.codemark;
				this.repoMarker = response.markers[0];
				callback();
			},
			{
				token,
				streamId: this.teamStream.id,
				wantCodemark: true,
				codemarkType: 'comment',
				wantMarkers: 1,
				withRandomStream: true,
				withRemotes: this.repoOptions.withRemotes,
				withKnownCommitHashes: this.repoOptions.withKnownCommitHashes,
				commitHash: this.repoOptions.commitHash
			}
		);
	}
	*/
}

module.exports = TestDataCreator;

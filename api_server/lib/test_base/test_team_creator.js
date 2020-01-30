'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class TestTeamCreator {

	constructor (options) {
		Object.assign(this, options);
	}

	create (callback) {
		this.users = [];
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

	createRegisteredUsers (callback) {
		BoundAsync.timesSeries(
			this,
			this.userOptions.numRegistered || 0,
			this.createRegisteredUser,
			callback
		);
	}

	createRegisteredUser (n, callback) {
		const data = this.test.userFactory.getRandomUserData();
		Object.assign(data, (this.userOptions.userData || [])[n] || {});
		this.test.userFactory.createUser(
			data,
			(error, userData) => {
				if (error) { return callback(error); }
				userData.password = data.password;
				this.users.push(userData);
				if (n === this.userOptions.currentUserIndex) {
					this.currentUser = userData;
					this.token = userData.accessToken;
				}
				callback();
			}
		);
	}

	createUnregisteredUsers (callback) {
		BoundAsync.timesSeries(
			this,
			this.userOptions.numUnregistered || 0,
			this.createUnregisteredUser,
			callback
		);
	}

	createUnregisteredUser (n, callback) {
		const data = this.test.userFactory.getRandomUserData();
		const userIndex = this.userOptions.numRegistered + n;
		Object.assign(data, this.userOptions.userData[userIndex] || {});
		this.test.userFactory.registerUser(
			data,
			(error, userData) => {
				if (error) { return callback(error); }
				this.users.push(userData);
				callback();
			}
		);
	}

	preCreateTeam (callback) {
		if (this.teamOptions.preCreateTeam) {
			this.teamOptions.preCreateTeam.call(this.test, this, callback);
		}
		else {
			callback();
		}
	}

	createTeam (callback) {
		if (!this.teamOptions.creatorToken && typeof this.teamOptions.creatorIndex !== 'number') {
			return callback();
		}
		const token = this.teamOptions.creatorToken || this.users[this.teamOptions.creatorIndex].accessToken;
		this.test.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.company = response.company;
				this.teamStream = response.streams[0];
				callback();
			},
			{
				token
			}
		);
	}

	inviteUsers (callback) {
		if (!this.teamOptions.creatorToken && typeof this.teamOptions.creatorIndex !== 'number') {
			return callback();
		}
		let numUsers = 0;
		if (this.teamOptions.members === 'all') {
			numUsers = (this.userOptions.numRegistered || 0) + (this.userOptions.numUnregistered || 0);
		}
		else if (this.teamOptions.members instanceof Array) {
			numUsers = this.teamOptions.members.length;
		}
		numUsers += this.teamOptions.numAdditionalInvites || 0;
		BoundAsync.timesSeries(
			this,
			numUsers,
			this.inviteUser,
			callback
		);
	}

	inviteUser (n, callback) {
		let userIndex = null;
		let email;
		if (n === this.teamOptions.creatorIndex) {
			return callback();
		}
		if (this.teamOptions.members === 'all') {
			if (n < (this.userOptions.numRegistered || 0) + (this.userOptions.numUnregistered || 0)) {
				userIndex = n;
			}
		}
		else if (this.teamOptions.members instanceof Array) {
			const member = this.teamOptions.members[n];
			if (typeof member === 'number') {
				if (n < this.teamOptions.members.length) {
					userIndex = this.teamOptions.members[n];
				}
			}
			else {
				email = member;
			}
		}
		const token = this.teamOptions.creatorToken || this.users[this.teamOptions.creatorIndex].accessToken;
		if (!email) {
			email = userIndex !== null ? this.users[userIndex].user.email : this.test.userFactory.randomEmail();
		}
		this.test.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: email,
					teamId: this.team.id,
					_pubnubUuid: this.test.userFactory.getNextPubnubUuid()
				},
				token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				if (userIndex !== null) { 
					this.users[userIndex].user = response.user;
				}
				else {
					this.users.push({ user: response.user });
				}
				this.team.memberIds.push(response.user.id);
				this.team.companyMemberCount++;
				callback();
			}
		);
	}

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
}

module.exports = TestTeamCreator;

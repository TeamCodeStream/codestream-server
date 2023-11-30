'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class TestTeamCreator {

	constructor (options) {
		Object.assign(this, options);
	}

	create (callback) {
		this.users = [];
		let series;
		if (this.test.usingNRLogins) {
			series = [
				this.createNRCompany,
				this.createNRUsers,
				this.createRepos
			];
		} else {
			series = [
				this.createUnregisteredUsers,
				this.confirmTeamCreator,
				this.preCreateTeam,
				this.createTeam,
				this.inviteUsers,
				this.confirmUsers,
				this.acceptInvites,
				this.createRepos
			];
		}
		BoundAsync.series(this, series, error => {
			if (error) { return callback(error); }
			callback(null, {
				team: this.team,
				company: this.company,
				teamStream: this.teamStream,
				repo: this.repo,
				repos: this.repos,
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

	createUnregisteredUsers (callback) {
		let numUsers =
			(this.userOptions.numRegistered || 0) +
			(this.userOptions.numUnregistered || 0);
		BoundAsync.timesSeries(
			this,
			numUsers,
			this.createUnregisteredUser,
			callback
		);
	}

	createUnregisteredUser (n, callback) {
		const data = this.test.userFactory.getRandomUserData();
		data._confirmationCheat = this.test.apiConfig.sharedSecrets.confirmationCheat;
		let userIndex = n;
		Object.assign(data, (this.userOptions.userData && this.userOptions.userData[userIndex]) || {});
		if (this.userOptions.cheatOnSubscription) {
			data._subscriptionCheat = this.test.apiConfig.sharedSecrets.subscriptionCheat;
		}
		this.test.userFactory.registerUser(
			data,
			(error, userData) => {
				if (error) { return callback(error); }
				this.users.push(userData);
				callback();
			}
		);
	}

	confirmTeamCreator (callback) {
		if (typeof this.teamOptions.creatorIndex !== 'number') { 
			return callback();
		}
		this.confirmUser(this.teamOptions.creatorIndex, callback);
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
		this.test.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.company = response.company;
				this.teamStream = response.streams[0];
				if (this.teamOptions.creatorToken && response.accessToken) {
					this.teamOptions.creatorToken = response.accessToken;
				}
				if (this.teamOptions.creatorIndex !== undefined) {
					Object.assign(this.users[this.teamOptions.creatorIndex].user, {
						teamIds: this.team.id,
						companyIds: this.company.id
					});
					if (response.user && response.user.$set && response.user.$set.nrUserId) {
						this.users[this.teamOptions.creatorIndex].user.nrUserId = response.user.$set.nrUserId;
					}
					if (response.user && response.user.$set && response.user.$set.nrUserInfo) {
						this.users[this.teamOptions.creatorIndex].user.nrUserInfo = response.user.$set.nrUserInfo;
					}
				}
				callback();
			},
			{
				token
			}
		);
	}

	createNRCompany (callback) {
		if (typeof this.teamOptions.creatorIndex !== 'number') {
			return callback();
		}
		this.test.userFactory.createMockNewRelicUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.teams[0];
				this.company = response.companies[0];
				this.teamStream = response.streams[0];
				this.teamOptions.creatorToken = response.accessToken;
				this.users[this.teamOptions.creatorIndex] = response;
				callback();
			}
		);
	}

	createNRUsers (callback) {
		BoundAsync.timesSeries(
			this,
			this.userOptions.numRegistered,
			this.createNRUser,
			callback
		);
	}

	createNRUser (n, callback) {
		if (typeof this.teamOptions.creatorIndex === 'number' && n === this.teamOptions.creatorIndex) {
			n++;
		}
		const isMember = (
			this.company && 
			(
				this.teamOptions.members === 'all' || 
				(
					this.teamOptions.members instanceof Array &&
					this.teamOptions.members.findIndex(n) !== -1
				)
			)
		);
		const withProps = isMember ? { nr_orgid: this.company.linkedNROrgId } : undefined;
		this.test.userFactory.createMockNewRelicUser(
			(error, response) => {
				if (error) { return callback(error); }
				if (n >= this.teamOptions.creatorIndex) {
					n++;
				}
				this.users[n] = response;
				if (n === this.userOptions.currentUserIndex) {
					this.currentUser = this.users[n];
					this.token = this.users[n].accessToken;
				}
				callback();
			},
			{
				withProps
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
		if (this.teamOptions.members === 'all' && n === this.teamOptions.creatorIndex) {
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

		const _subscriptionCheat = this.userOptions.cheatOnSubscription ? this.test.apiConfig.sharedSecrets.subscriptionCheat : undefined;
		this.test.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: email,
					teamId: this.team.id,
					_pubnubUuid: this.test.userFactory.getNextPubnubUuid(),
					_subscriptionCheat
				},
				token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				if (userIndex !== null) { 
					const confirmationCode = this.users[userIndex].user.confirmationCode;
					this.users[userIndex].user = response.user;
					this.users[userIndex].user.confirmationCode = confirmationCode;
				}
				else {
					this.users.push({ user: response.user });
				}
				if (!this.team.memberIds.includes(response.user.id)) {
					this.team.memberIds.push(response.user.id);
				}
				this.team.companyMemberCount++;
				callback();
			}
		);
	}

	confirmUsers (callback) {
		BoundAsync.timesSeries(
			this,
			this.userOptions.numRegistered || 0,
			this.confirmUser,
			callback
		);
	}
	
	confirmUser (n, callback) {
		if (this.users[n].accessToken) { return callback(); }
		this.test.userFactory.confirmUser(
			this.users[n].user,
			(error, response) => {
				if (error) { return callback(error); }
				const password = this.users[n].password;
				this.users[n] = response;
				this.users[n].password = password;
				if (n === this.userOptions.currentUserIndex) {
					this.currentUser = response;
					this.token = response.accessToken;
				}
				callback();
			}
		);
	}

	acceptInvites (callback) {
		if (!this.company) { return callback(); }
		BoundAsync.timesSeries(
			this,
			this.userOptions.numRegistered || 0,
			this.acceptInvite,
			callback
		);
	}

	acceptInvite (n, callback) {
		if ((this.users[n].user.companyIds || []).includes(this.company.id)) {
			return callback();
		}
		if (
			this.teamOptions.members !== 'all' &&
			this.teamOptions.members instanceof Array &&
			 !this.teamOptions.members.includes(n)
		) {
			return callback();
		}
		this.test.doApiRequest(
			{
				method: 'put',
				path: '/join-company/' + this.company.id,
				token: this.users[n].accessToken,
				requestOptions: {
					headers: {
						'X-CS-Confirmation-Cheat': this.test.apiConfig.sharedSecrets.confirmationCheat
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.users[n].user = response.user;
				this.users[n].accessToken = response.accessToken;
				this.users[n].broadcasterToken = response.broadcasterToken;
				if (n === this.userOptions.currentUserIndex) {
					this.currentUser = this.users[n];
					this.token = response.accessToken;
				}
				callback();
			}
		);
	}

	createRepos (callback) {
		const numRepos = this.repoOptions ? (this.repoOptions.numRepos || 1) : 0;
		if (!numRepos) { return callback(); }
		this.repos = [];
		BoundAsync.timesSeries(
			this,
			numRepos,
			this.createRepo,
			callback
		);
	}

	createRepo (n, callback) {
		if (
			!this.repoOptions || 
			(
				typeof this.repoOptions.creatorIndex !== 'number' && 
				!this.repoOptions.creatorToken
			)
		) {
			return callback();
		}	
		const token = this.repoOptions.creatorToken === 'teamCreatorToken' ? this.teamOptions.creatorToken : 
			(this.repoOptions.creatorToken || this.users[this.repoOptions.creatorIndex].accessToken);
		this.test.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.repos.push(response.repos[0]);
				if (n === 0) {
					this.repo = response.repos[0];
					this.repoStreams = response.streams;
					this.repoPost = response.post;
					this.repoCodemark = response.codemark;
					this.repoMarker = response.markers[0];
				}
				const waitTime = this.repoOptions.waitAfterCreateRepo || 0;
				setTimeout(callback, waitTime);
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

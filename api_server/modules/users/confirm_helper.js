// provides a set of common routines for confirm a user's registration

'use strict';

const LoginHelper = require('./login_helper');
const PasswordHasher = require('./password_hasher');
const UsernameChecker = require('./username_checker');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class ConfirmHelper {

	constructor (options) {
		Object.assign(this, options);
	}

	async confirm (data) {
		this.data = data;
		await this.hashPassword();			// hash the provided password, if given
		await this.checkUsernameUnique();	// check that the user's username will be unique for their team, as needed
		await this.updateUser();			// update the user's database record
		await this.doLogin();				// proceed with the actual login
		return this.responseData;
	}

	// hash the given password, as needed
	async hashPassword () {
		if (!this.data.password) { return; }
		this.passwordHash = await new PasswordHasher({
			errorHandler: this.request.errorHandler,
			password: this.data.password
		}).hashPassword();
		delete this.data.password;
	}

	// check that the user's username will be unique for the team(s) they are on
	async checkUsernameUnique () {
		if (this.dontCheckUsername) {
			return;
		}
		const username = this.data.username || this.user.get('username');
		if (!username) {
			return;
		}
		// we check against each team the user is on, it must be unique in all teams
		const teamIds = this.user.get('teamIds') || [];
		const usernameChecker = new UsernameChecker({
			data: this.request.data,
			username: username,
			userId: this.user.id,
			teamIds: teamIds
		});
		const isUnique = await usernameChecker.checkUsernameUnique();
		if (!isUnique) {
			throw this.request.errorHandler.error('usernameNotUnique', {
				info: {
					username: username,
					teamIds: usernameChecker.notUniqueTeamIds
				}
			});
		}
	}

	// proceed with the actual login, calling into a login helper 
	async doLogin () {
		const loginHelper = new LoginHelper({
			request: this.request,
			user: this.user,
			loginType: this.loginType
		});
		if (this.notTrueLogin) {
			await loginHelper.allowLogin();
		} 
		else {
			this.responseData = await loginHelper.login();
		}
	}

	// update the user in the database, indicating they are confirmed
	async updateUser () {
		await this.getFirstTeam();		// get the first team the user is on, if needed, this becomes the "origin" team
		await this.getTeamCreator();	// get the creator of that team
		await this.doUserUpdate();		// do the actual update
	}

	// get the first team the user is on, if needed
	// this is need to determine the "origin team" for the user, for analytics
	async getFirstTeam () {
		if ((this.user.get('teamIds') || []).length === 0) {
			return;
		}
		const teamId = this.user.get('teamIds')[0];
		this.firstTeam = await this.request.data.teams.getById(teamId);
	}

	// get the creator of the first team the user was on, if needed
	// this is need to determine the "origin team" for the user, for analytics
	async getTeamCreator () {
		if (!this.firstTeam) {
			return;
		}
		this.teamCreator = await this.request.data.users.getById(
			this.firstTeam.get('creatorId')
		);
	}

	// update the user in the database, indicating they are confirmed,
	// and add analytics data or other attributes as needed
	async doUserUpdate () {
		const now = Date.now();
		const op = {
			$set: {
				isRegistered: true,
				modifiedAt: now,
				registeredAt: now
			}, 
			$unset: {
				confirmationCode: true,
				confirmationAttempts: true,
				confirmationCodeExpiresAt: true,
				'accessTokens.conf': true,
				inviteCode: true,
				needsAutoReinvites: true,
				autoReinviteInfo: true
			}
		};

		if (this.passwordHash) {
			op.$set.passwordHash = this.passwordHash;
		}

		['email', 'username', 'fullName', 'timeZone'].forEach(attribute => {
			if (this.data[attribute]) {
				op.$set[attribute] = this.data[attribute];
			}
		});
		if (this.data.email) {
			op.$set.searchableEmail = this.data.email.toLowerCase();
		}

		if ((this.user.get('teamIds') || []).length > 0) {
			if (!this.user.get('joinMethod')) {
				op.$set.joinMethod = 'Added to Team';	// for tracking
			}
			if (!this.user.get('primaryReferral')) {
				op.$set.primaryReferral = 'internal';
			}
			if (
				!this.user.get('originTeamId') &&
				this.teamCreator && 
				this.teamCreator.get('originTeamId')
			) {
				op.$set.originTeamId = this.teamCreator.get('originTeamId');
			}
		}

		this.request.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.request.data.users,
			id: this.user.id
		}).save(op);
	}
}

module.exports = ConfirmHelper;
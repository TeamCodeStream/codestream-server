// provides a set of common routines for confirm a user's registration

'use strict';

const LoginHelper = require('./login_helper');
const PasswordHasher = require('./password_hasher');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const JoinCompanyHelper = require('./join_company_helper');

class ConfirmHelper {

	constructor (options) {
		Object.assign(this, options);
	}

	async confirm (data) {
		this.responseData = {};
		this.data = data;
		await this.hashPassword();			// hash the provided password, if given
		await this.updateUser();			// update the user's database record
		await this.joinCompany();			// automatically join a company if requested
		await this.doLogin();				// proceed with the actual login
		if (this.user.get('companyName')) {
			// this indicates the user is in the process of creating a new org,
			// we want the client to skip the join-company step and force creating one
			this.responseData.forceCreateCompany = true;
		}
		return this.responseData;
	}

	// hash the given password, as needed
	async hashPassword () {
		if (this.data.passwordHash) {
			this.passwordHash = this.data.passwordHash;
			return;
		} else if (!this.data.password) { 
			return; 
		}

		this.passwordHash = await new PasswordHasher({
			errorHandler: this.request.errorHandler,
			password: this.data.password
		}).hashPassword();
		delete this.data.password;
	}

	// proceed with the actual login, calling into a login helper 
	async doLogin () {
		const loginHelper = new LoginHelper({
			request: this.request,
			user: this.user,
			loginType: this.loginType,
			nrAccountId: this.nrAccountId,
			dontUpdateLastLogin: this.dontUpdateLastLogin,
			dontSetFirstSession: this.dontSetFirstSession
		});
		if (this.notRealLogin) {
			this.responseData = await loginHelper.allowLogin();
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
				registeredAt: now,
				"preferences.acceptedTOS": true
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

	// the confirming user is in the process of joining a company
	async joinCompany () {
		if (!this.user.get('joinCompanyId')) { return; }
		this.joinCompanyHelper = new JoinCompanyHelper({
			request: this.request,
			user: this.user,
			inviteOnly: true,
			alreadyConfirmed: true,
			originalEmail: this.user.get('originalEmail'),
			companyId: this.user.get('joinCompanyId'),
			confirmHelperClass: ConfirmHelper // this avoids a circular require
		});
		await this.joinCompanyHelper.authorize();
		await this.joinCompanyHelper.process();
		this.user = this.request.user = this.request.request.user = this.joinCompanyHelper.invitedUser;
	}

	async postProcess () {
		if (this.joinCompanyHelper) {
			return this.joinCompanyHelper.postProcess();
		}
	}
}

module.exports = ConfirmHelper;
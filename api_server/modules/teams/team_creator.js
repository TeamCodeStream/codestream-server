'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Team = require('./team');
var CompanyCreator = require(process.env.CS_API_TOP + '/modules/companies/company_creator');
var UserCreator = require(process.env.CS_API_TOP + '/modules/users/user_creator');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
var TeamSubscriptionGranter = require('./team_subscription_granter');
const TeamAttributes = require('./team_attributes');
const Errors = require('./errors');

class TeamCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.dontSaveIfExists = true;
	}

	get modelClass () {
		return Team;
	}

	get collectionName () {
		return 'teams';
	}

	createTeam (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['name']
			},
			optional: {
				'array(string)': ['memberIds', 'emails']
			}
		};
	}

	validateAttributes (callback) {
		this.validator = new CodeStreamModelValidator(TeamAttributes);
		this.setDefaults();
		let error =	this.validateName() ||
			this.validateMemberIds() ||
			this.validateEmails();
		return process.nextTick(() => callback(error));
	}

	validateName () {
		let error = this.validator.validateString(this.attributes.name);
		if (error) {
			return { name: error };
		}
	}

	validateMemberIds () {
		let error = this.validator.validateArrayOfIds(this.attributes.memberIds);
		if (error) {
			return { memberIds: error };
		}
	}

	validateEmails () {
		if (!this.attributes.emails) { return; }
		let error = this.validator.validateArray(this.attributes.emails);
		if (error) {
			return { emails: error };
		}
	}

	setDefaults () {
		this.ensureUserIsMember();
	}

	ensureUserIsMember () {
		this.attributes.memberIds = this.attributes.memberIds || [this.user.id];
		if (!(this.attributes.memberIds instanceof Array)) {
			return; // this will get caught later
		}
		if (this.attributes.memberIds.indexOf(this.user.id) === -1) {
			this.attributes.memberIds.push(this.user.id);
		}
		this.attributes.memberIds.sort();
	}

	checkExistingQuery () {
		// note: this isn't really relevant right now, because we don't allow to specify companyId yet (if ever?)
		if (!this.attributes.companyId) {
			return; // no need if no company yet, this will be the first team for this company
		}
		let query = {
			companyId: this.attributes.companyId
		};
		if (this.attributes.name) {
			query.name = this.attributes.name;
		}
		else {
			query.memberIds = this.attributes.memberIds;
		}
		return query;
	}

	modelCanExist () {
		return !this.attributes.name;
	}

	preSave (callback) {
		this.attributes.creatorId = this.user.id;
		BoundAsync.series(this, [
			this.checkCreateUsers,
			this.checkUsernamesUnique,
			this.checkCreateCompany,
			super.preSave
		], callback);
	}

	checkCreateUsers (callback) {
		if (
			!(this.attributes.emails instanceof Array) ||
			this.attributes.emails.length === 0
		) {
			return callback();
		}
		this.usersCreated = [];
		BoundAsync.forEachSeries(
			this,
			this.attributes.emails,
			this.createUser,
			(error) => {
				if (error) { return callback(error); }
				delete this.attributes.emails;
				callback();
			}
		);
	}

	createUser (email, callback) {
		this.userCreator = new UserCreator({
			request: this.request,
			dontSaveIfExists: true,
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		this.userCreator.createUser(
			{
				email: email
			},
			(error, user) => {
				if (error) { return callback(error); }
				this.usersCreated.push(user);
				if (user.id !== this.user.id) {
					this.attributes.memberIds.push(user.id);
				}
				process.nextTick(callback);
			}
		);
	}

	checkUsernamesUnique (callback) {
		if (!this.usersCreated) { return callback(); }
		let usernames = this.usersCreated.map(user => user.get('username') ? user.get('username').toLowerCase() : null);
		usernames.push(this.user.get('username') ? this.user.get('username').toLowerCase() : null);
		usernames = usernames.filter(username => !!username);
		usernames.sort();
		let i, len;
		for (i = 0, len = usernames.length; i < len; i++) {
			if (i > 0 && usernames[i].localeCompare(usernames[i-1]) === 0) {
				break;
			}
		}
		if (i < len) {
			return callback(this.errorHandler.error('usernameNotUnique', { info: usernames[i] }));
		}
		else {
			return process.nextTick(callback);
		}
	}

	checkCreateCompany (callback) {
		if (this.attributes.companyId) {
			return callback();
		}
		else {
			this.createCompanyForTeam(callback);
		}
	}

	createCompanyForTeam (callback) {
		let company = this.attributes.company || {};
		company.name = company.name || this.attributes.name;
		new CompanyCreator({
			request: this.request
		}).createCompany(
			company,
			(error, company) => {
				if (error) { return callback(error); }
				this.attributes.companyId = company.id;
				this.company = company;
				process.nextTick(callback);
			}
		);
	}

	postSave (callback) {
		BoundAsync.series(this, [
			super.postSave,
			this.updateUsers,
			this.grantUserMessagingPermissions
		], callback);
	}

	updateUsers (callback) {
		let users = [this.user, ...(this.usersCreated || [])];
		this.members = [];
		BoundAsync.forEachSeries(
			this,
			users,
			this.updateUser,
			callback
		);
	}

	updateUser (user, callback) {
		this.data.users.applyOpById(
			user.id,
			{
				'$addToSet': {
					companyIds: this.attributes.companyId,
					teamIds: this.model.id
				}
			},
			(error, updatedUser) => {
				if (error) { return callback(error); }
				this.members.push(updatedUser);
				process.nextTick(callback);
			}
		);
	}

 	grantUserMessagingPermissions (callback) {
		let granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			team: this.model,
			members: this.users
		};
		new TeamSubscriptionGranter(granterOptions).grantToMembers(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}
}

module.exports = TeamCreator;

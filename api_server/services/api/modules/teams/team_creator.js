'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Team = require('./team');
var Company_Creator = require(process.env.CS_API_TOP + '/services/api/modules/companies/company_creator');
var User_Creator = require(process.env.CS_API_TOP + '/services/api/modules/users/user_creator');
var CodeStream_Model_Validator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
var Team_Subscription_Granter = require('./team_subscription_granter');
const Team_Attributes = require('./team_attributes');
const Errors = require('./errors');

class Team_Creator extends Model_Creator {

	constructor (options) {
		super(options);
		this.error_handler.add(Errors);
		this.dont_save_if_exists = true;
	}

	get model_class () {
		return Team;
	}

	get collection_name () {
		return 'teams';
	}

	create_team (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	get_required_attributes () {
		return ['name'];
	}

	validate_attributes (callback) {
		this.validator = new CodeStream_Model_Validator(Team_Attributes);
		this.set_defaults();
		let error =	this.validate_name() ||
			this.validate_member_ids() ||
			this.validate_emails();
		return process.nextTick(() => callback(error));
	}

	validate_name () {
		let error = this.validator.validate_string(this.attributes.name);
		if (error) {
			return { name: error };
		}
	}

	validate_member_ids () {
		let error = this.validator.validate_array_of_ids(this.attributes.member_ids);
		if (error) {
			return { member_ids: error };
		}
	}

	validate_emails () {
		if (!this.attributes.emails) { return; }
		let error = this.validator.validate_array(this.attributes.emails);
		if (error) {
			return { emails: error };
		}
	}

	set_defaults () {
		this.ensure_user_is_member();
	}

	ensure_user_is_member () {
		this.attributes.member_ids = this.attributes.member_ids || [this.user.id];
		if (!(this.attributes.member_ids instanceof Array)) {
			return; // this will get caught later
		}
		if (this.attributes.member_ids.indexOf(this.user.id) === -1) {
			this.attributes.member_ids.push(this.user.id);
		}
		this.attributes.member_ids.sort();
	}

	allow_attributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['name'],
				'array(string)': ['member_ids', 'emails']
			}
		);
		process.nextTick(callback);
	}

	check_existing_query () {
		if (!this.attributes.company_id) {
			return; // no need if no company yet, this will be the first team for this company
		}
		let query = {
			company_id: this.attributes.company_id
		};
		if (this.attributes.name) {
			query.name = this.attributes.name;
		}
		else {
			query.member_ids = this.attributes.member_ids;
		}
		return query;
	}

	model_can_exist () {
		return !this.attributes.name;
	}

	pre_save (callback) {
		this.attributes.creator_id = this.user.id;
		Bound_Async.series(this, [
			this.check_create_users,
			this.check_usernames_unique,
			this.check_create_company,
			super.pre_save
		], callback);
	}

	check_create_users (callback) {
		if (
			!(this.attributes.emails instanceof Array) ||
			this.attributes.emails.length === 0
		) {
			return callback();
		}
		this.users_created = [];
		Bound_Async.forEachSeries(
			this,
			this.attributes.emails,
			this.create_user,
			(error) => {
				if (error) { return callback(error); }
				delete this.attributes.emails;
				callback();
			}
		);
	}

	create_user (email, callback) {
		this.user_creator = new User_Creator({
			request: this.request,
			ok_if_exists: true,
			dont_save_if_exists: true
		});
		this.user_creator.create_user(
			{
				email: email
			},
			(error, user) => {
				if (error) { return callback(error); }
				this.users_created.push(user);
				if (user.id !== this.user.id) {
					this.attributes.member_ids.push(user.id);
				}
				process.nextTick(callback);
			}
		);
	}

	check_usernames_unique (callback) {
		if (!this.users_created) { return callback(); }
		let usernames = this.users_created.map(user => user.get('username') ? user.get('username').toLowerCase() : null);
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
			return callback(this.error_handler.error('username_not_unique', { info: usernames[i] }));
		}
		else {
			return process.nextTick(callback);
		}
	}

	check_create_company (callback) {
		if (this.attributes.company_id) {
			return callback();
		}
		else {
			this.create_company_for_team(callback);
		}
	}

	create_company_for_team (callback) {
		let company = this.attributes.company || {};
		company.name = company.name || this.attributes.name;
		new Company_Creator({
			request: this.request
		}).create_company(
			company,
			(error, company) => {
				if (error) { return callback(error); }
				this.attributes.company_id = company.id;
				this.company = company;
				this.attach_to_response.company = company.get_sanitized_object();
				process.nextTick(callback);
			}
		);
	}

	post_save (callback) {
		Bound_Async.series(this, [
			super.post_save,
			this.update_users,
			this.grant_user_messaging_permissions
		], callback);
	}

	update_users (callback) {
		let users = [this.user, ...(this.users_created || [])];
		this.sanitized_users = [];
		Bound_Async.forEachSeries(
			this,
			users,
			this.update_user,
			(error) => {
				if (error) { return callback(error); }
				this.attach_to_response.users = this.sanitized_users;
				callback();
			}
		);
	}

	update_user (user, callback) {
		this.data.users.apply_op_by_id(
			user.id,
			{
				add: {
					company_ids: this.attributes.company_id,
					team_ids: this.model.id
				}
			},
			(error, updated_user) => {
				if (error) { return callback(error); }
				if (updated_user.id !== this.user.id) {
					this.sanitized_users.push(updated_user.get_sanitized_object());
				}
				process.nextTick(callback);
			}
		);
	}

 	grant_user_messaging_permissions (callback) {
		new Team_Subscription_Granter({
			data: this.data,
			messager: this.api.services.messager,
			team: this.model,
			members: this.users
		}).grant_to_members(error => {
			if (error) {
				return callback(this.error_handler.error('messaging_grant', { reason: error }));
			}
			callback();
		});
	}
}

module.exports = Team_Creator;

'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Team = require('./team');
var Company_Creator = require(process.env.CI_API_TOP + '/services/api/modules/companies/company_creator');
var User_Creator = require(process.env.CI_API_TOP + '/services/api/modules/users/user_creator');
var CodeStream_Model_Validator = require(process.env.CI_API_TOP + '/lib/models/codestream_model_validator');
var Team_Attributes = require('./team_attributes');
var Allow = require(process.env.CI_API_TOP + '/lib/util/allow');

class Team_Creator extends Model_Creator {

	constructor (options) {
		super(options);
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
		var error = this.validator.validate_string(this.attributes.name);
		if (error) {
			return { name: error };
		}
	}

	validate_member_ids () {
		var error = this.validator.validate_array_of_ids(this.attributes.member_ids);
		if (error) {
			return { member_ids: error };
		}
	}

	validate_emails () {
		if (!this.attributes.emails) { return; }
		var error = this.validator.validate_array(this.attributes.emails);
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
		var query = {
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
				emails: [email]
			},
			(error, user) => {
				if (error) { return callback(error); }
				this.users_created.push(user);
				process.nextTick(callback);
			}
		);
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
			this.update_users
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
}

module.exports = Team_Creator;

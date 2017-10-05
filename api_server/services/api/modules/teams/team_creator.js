'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Team = require('./team');
var Company_Creator = require(process.env.CI_API_TOP + '/services/api/modules/companies/company_creator');
var Allow = require(process.env.CI_API_TOP + '/lib/util/allow');

class Team_Creator extends Model_Creator {

	get model_class () {
		return Team;
	}

	get collection_name () {
		return 'teams';
	}

	create_team (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	allow_attributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['name', 'member_ids']
			}
		);
		process.nextTick(callback);
	}

	validate_attributes (callback) {
		this.set_defaults();
		let required_attributes = ['name'];
		let error =	this.check_required(required_attributes) ||
			this.validate_member_ids();
		return process.nextTick(() => callback(error));
	}

	validate_member_ids () {
		if (!(this.attributes.member_ids instanceof Array)) {
			return { member_ids: 'must be an array' };
		}
	}

	set_defaults () {
		this.ensure_user_is_member();
		this.dont_save_if_exists = true;
	}

	ensure_user_is_member () {
		this.attributes.member_ids = this.attributes.member_ids || [this.user.id];
		if (!(this.attributes.member_ids instanceof Array)) {
			// this will get caught later
			return;
		}
		if (this.attributes.member_ids.indexOf(this.user.id) === -1) {
			this.attributes.member_ids.push(this.user.id);
		}
		this.attributes.member_ids.sort();
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
			this.check_create_company,
			super.pre_save
		], callback);
	}

	post_save (callback) {
		Bound_Async.series(this, [
			super.post_save,
			this.update_user
		], callback);
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
			(error, company_model) => {
				if (error) { return callback(error); }
				this.attributes.company_id = company_model.id;
				this.company = company_model.attributes;
				callback();
			}
		);
	}

	update_user (callback) {
		this.data.users.apply_op_by_id(
			this.user.id,
			{
				add: {
					company_ids: this.attributes.company_id,
					team_ids: this.model.id
				}
			},
			(error, updated_user) => {
				if (error) { return callback(error); }
				this.user = updated_user;
				callback();
			}
		);
	}
}

module.exports = Team_Creator;

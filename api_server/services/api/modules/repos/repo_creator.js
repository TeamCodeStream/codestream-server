'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Repo = require('./repo');
var Normalize_URL = require('normalize-url');
var Allow = require(process.env.CI_API_TOP + '/lib/util/allow');
var Add_Team_Members = require(process.env.CI_API_TOP + '/services/api/modules/teams/add_team_members');
var Team_Creator = require(process.env.CI_API_TOP + '/services/api/modules/teams/team_creator');
var CodeStream_Model_Validator = require(process.env.CI_API_TOP + '/lib/models/codestream_model_validator');
const Repo_Attributes = require('./repo_attributes');
const Errors = require('./errors');

class Repo_Creator extends Model_Creator {

	constructor (options) {
		super(options);
		this.error_handler.add(Errors);
		this.dont_save_if_exists = true;
	}

	get model_class () {
		return Repo;
	}

	get collection_name () {
		return 'repos';
	}

	create_repo (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	get_required_attributes () {
		return ['url', 'first_commit_sha'];
	}

	validate_attributes (callback) {
		this.validator = new CodeStream_Model_Validator(Repo_Attributes);
		let error =
			this.validate_url() ||
			this.validate_sha();
		if (error) {
			return callback(error);
		}
		process.nextTick(callback);
	}

	validate_url () {
		let error = this.validator.validate_url(this.attributes.url);
		if (error) {
		 	return { url: error };
	 	}
	}

	validate_sha () {
		let error = this.validator.validate_string(this.attributes.first_commit_sha);
		if (error) {
			return { first_commit_sha: error };
		}
	}

	normalize (callback) {
		if (typeof this.attributes.url === 'string') { // validation to come later
			this.attributes.url = Normalize_URL(
				this.attributes.url.toLowerCase(),
				{
					removeQueryParameters: [/^.+/] // remove them all!
				}
			);
		}
		if (typeof this.attributes.first_commit_sha === 'string') { // validation to come later
			this.attributes.first_commit_sha = this.attributes.first_commit_sha.toLowerCase();
		}
		process.nextTick(callback);
	}

	allow_attributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['url', 'first_commit_sha', 'team_id'],
				object: ['team'],
				'array(string)': ['emails']
			}
		);
		process.nextTick(callback);
	}

	model_can_exist () {
		return true;
	}

	check_existing_query () {
		return {
			url: this.attributes.url
		};
	}

	pre_save (callback) {
		this.attributes.creator_id = this.user.id;
		Bound_Async.series(this, [
			this.join_to_team,
			super.pre_save
		], callback);
	}

	join_to_team (callback) {
		if (this.existing_model) {
			this.join_users_to_repo_team(callback);
		}
		else if (this.attributes.team_id) {
			this.join_repo_to_existing_team(callback);
		}
		else if (this.attributes.team) {
			this.create_team_for_repo(callback);
		}
		else {
			return callback(this.error_handler.error('attribute_required', { info: 'team' }));
		}
	}

	join_users_to_repo_team (callback) {
		// join the current user and any other users to the team that already owns this repo
		// first verify that the SHA for the first commit is valid
		if (this.attributes.first_commit_sha !== this.existing_model.get('first_commit_sha')) {
			return callback(this.error_handler.error('sha_mismatch'));
		}
		if (
			!this.attributes.emails &&
			(this.user.get('team_ids') || []).indexOf(this.existing_model.get('team_id')) !== -1
		) {
			return callback();
		}
		let adder = new Add_Team_Members({
			request: this.request,
			users: [this.user],
			emails: this.attributes.emails,
			team_id: this.existing_model.get('team_id')
		});
		adder.add_team_members(error => {
			if (error) { return callback(error); }
			this.attach_to_response.users = adder.sanitized_users;
			process.nextTick(callback);
		});
	}

	join_repo_to_existing_team (callback) {
		Bound_Async.series(this, [
			this.get_team,
			this.add_users_to_team
		], callback);
	}

	get_team (callback) {
		// join this repo to the team already specified by the caller
		this.data.teams.get_by_id(
			this.attributes.team_id,
			(error, team) => {
			 	if (error) { return callback(error); }
				if (!team) {
					return callback(this.error_handler.error('not_found', { info: 'team' }));
				}
				if ((team.get('member_ids') || []).indexOf(this.user.id) === -1) {
					return callback(this.error_handler.error('update_auth', { reason: 'user not on team' }));
				}
				this.team = team;
				this.attributes.company_id = team.get('company_id');
				callback();
			}
		);
	}

	add_users_to_team (callback) {
		if (!(this.attributes.emails instanceof Array)) {
			return callback();
		}
		let adder = new Add_Team_Members({
			request: this.request,
			emails: this.attributes.emails,
			team: this.team
		});
		adder.add_team_members(error => {
			if (error) { return callback(error); }
			this.attach_to_response.users = adder.sanitized_users;
			delete this.attributes.emails;
			process.nextTick(callback);
		});
	}

	create_team_for_repo (callback) {
		// create a new team for this repo
		this.team_creator = new Team_Creator({
			request: this.request
		});
		this.team_creator.create_team(
			this.attributes.team,
			(error, team) => {
				if (error) { return callback(error); }
				this.attributes.team_id = team.id;
				this.attributes.company_id = team.get('company_id');
				this.attach_to_response.team = team.get_sanitized_object();
				this.attach_to_response.company = this.team_creator.attach_to_response.company;
				this.attach_to_response.users = this.team_creator.attach_to_response.users;
				delete this.attributes.team;
				callback();
			}
		);
	}
}

module.exports = Repo_Creator;

'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Repo = require('./repo');
var Normalize_URL = require('normalize-url');
var Allow = require(process.env.CI_API_TOP + '/lib/util/allow');
var Repo_Attributes = require('./repo_attributes');
var Team_Joiner = require(process.env.CI_API_TOP + '/services/api/modules/teams/team_joiner');
var Team_Creator = require(process.env.CI_API_TOP + '/services/api/modules/teams/team_creator');
var CodeStream_Model_Validator = require(process.env.CI_API_TOP + '/lib/models/codestream_model_validator');
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
		var error =
			this.validate_url() ||
			this.validate_sha();
		if (error) {
			return callback(error);
		}
		process.nextTick(callback);
	}

	validate_url () {
		var error = this.validator.validate_url(this.attributes.url);
		if (error) {
		 	return { url: error };
	 	}
	}

	validate_sha () {
		var error = this.validator.validate_string(this.attributes.first_commit_sha);
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
				object: ['team']
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
			this.join_user_to_repo_team(callback);
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

	join_user_to_repo_team (callback) {
		// join the user to the team that already owns this repo
		// first verify that the SHA for the first commit is valid
		if (this.attributes.first_commit_sha !== this.existing_model.get('first_commit_sha')) {
			return callback(this.error_handler.error('sha_mismatch'));
		}
		if ((this.user.get('team_ids') || []).indexOf(this.existing_model.get('team_id')) !== -1) {
			return callback();
		}
		new Team_Joiner({
			request: this.request,
			team_id: this.existing_model.get('team_id')
		}).join_team(callback);
	}

	join_repo_to_existing_team (callback) {
		// join this repo to the team already specified by the caller
		// ACL concern: this user must already be a member of the team
		this.data.teams.get_by_id(
			this.attributes.team_id,
			(error, team) => {
			 	if (error) { return callback(error); }
				this.attributes.company_id = team.get('company_id');
				callback();
			}
		);
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

'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Repo = require('./repo');
var Normalize_URL = require('normalize-url');
var Allow = require(process.env.CI_API_TOP + '/lib/util/allow');
var Team_Joiner = require(process.env.CI_API_TOP + '/services/api/modules/teams/team_joiner');
var Team_Creator = require(process.env.CI_API_TOP + '/services/api/modules/teams/team_creator');
const Errors = require('./errors');

class Repo_Creator extends Model_Creator {

	constructor (options) {
		super(options);
		this.error_handler.add(Errors);
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

	validate_attributes (callback) {
		var required_attributes = ['url', 'first_commit_sha'];
		var error =	this.check_required(required_attributes);
		if (error) {
			return process.nextTick(() => callback(error));
		}
		this.set_defaults();
		process.nextTick(callback);
	}

	set_defaults () {
		this.normalize();
		this.dont_save_if_exists = true;
	}

	normalize () {
		this.attributes.url = Normalize_URL(this.attributes.url.toLowerCase());
		this.attributes.first_commit_sha = this.attributes.first_commit_sha.toLowerCase();
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
		this.attributes.creator_id = this.user._id.toString();
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
		if ((this.user.team_ids || []).indexOf(this.existing_model.get('team_id')) !== -1) {
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
				this.attributes.company_id = team.company_id;
				callback();
			}
		);
	}

	create_team_for_repo (callback) {
		// create a new team for this repo
		new Team_Creator({
			request: this.request
		}).create_team(
			this.attributes.team,
			(error, team_model) => {
				if (error) { return callback(error); }
				this.attributes.team_id = team_model.id;
				this.attributes.company_id = team_model.get('company_id');
				this.attach_to_response = { team: team_model.sanitize().attributes };
				delete this.attributes.team;
				callback();
			}
		);
	}
}

module.exports = Repo_Creator;

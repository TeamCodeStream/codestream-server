'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
const Errors = require('./errors');

class Team_Joiner  {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'error_handler', 'user'].forEach(x => this[x] = this.request[x]);
		this.error_handler.add(Errors);
	}

	join_team (callback) {
		Bound_Async.series(this, [
			this.get_team,
			this.check_username_unique,
			this.add_to_team,
			this.update_user
		], callback);
	}

	get_team (callback) {
		if (this.team) { return callback(); }
		if (!this.team_id) {
			return callback(this.error_handler.error('missing_argument', { info: 'team_id'}));
		}
		this.data.teams.get_by_id(
			this.team_id,
			(error, team) => {
				if (error) { return callback(error); }
				if (!team) {
					return callback(this.error_handler.error('not_found', { info: 'team'}));
				}
				this.team = team;
				callback();
			}
		);
	}

	check_username_unique (callback) {
		this.data.users.get_one_by_query(
			{
				team_ids: this.team._id,
				deactivated: false,
				searchable_username: this.user.username.toLowerCase()
			},
			(error, user) => {
				if (error) { return callback(error); }
				if (user) {
					return callback(this.error_handler.error('username_not_unique', { info: this.user.username }));
				}
				callback();
			}
		);
	}

	add_to_team (callback) {
		this.data.teams.apply_op_by_id(
			this.team._id,
			{ add: { member_ids: this.user._id } },
			callback
		);
	}

	update_user (callback) {
		this.data.users.apply_op_by_id(
			this.user._id,
			{
				add: {
					company_ids: this.team.company_id,
					team_ids: this.team._id
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

module.exports = Team_Joiner;

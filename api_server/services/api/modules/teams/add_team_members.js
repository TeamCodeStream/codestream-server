'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var User_Creator = require(process.env.CS_API_TOP + '/services/api/modules/users/user_creator');
var Team_Subscription_Granter = require('./team_subscription_granter');
const Errors = require('./errors');

class Add_Team_Members  {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'error_handler', 'user'].forEach(x => this[x] = this.request[x]);
		this.error_handler.add(Errors);
	}

	add_team_members (callback) {
		Bound_Async.series(this, [
			this.get_team,
			this.get_members,
			this.eliminate_duplicates,
			this.check_create_users,
			this.check_usernames_unique,
			this.add_to_team,
			this.update_users,
			this.grant_user_messaging_permissions
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

	get_members (callback) {
		this.data.users.get_by_ids(
			this.team.get('member_ids'),
			(error, members) => {
				if (error) { return callback(error); }
				this.existing_members = members;
				callback();
			}
		);
	}

	eliminate_duplicates (callback) {
		if (!this.users) {
			return callback();
		}
		let existing_ids = this.existing_members.map(member => member.id);
		let non_duplicate_users = [];
		this.users.forEach(user => {
			if (existing_ids.indexOf(user.id) === -1) {
				non_duplicate_users.push(user);
			}
		});
		this.users = non_duplicate_users;
		process.nextTick(callback);
	}

	check_create_users (callback) {
		if (
			!(this.emails instanceof Array) ||
			this.emails.length === 0
		) {
			return callback();
		}
		this.users_created = [];
		Bound_Async.forEachSeries(
			this,
			this.emails,
			this.create_user,
			callback
		);
	}

	create_user (email, callback) {
		if (this.existing_members.find(member => {
			return member.get('searchable_email') === email.toLowerCase();
		})) {
			return callback();
		}
		this.user_creator = new User_Creator({
			request: this.request,
			dont_save_if_exists: true
		});
		this.user_creator.create_user(
			{
				email: email
			},
			(error, user) => {
				if (error) { return callback(error); }
				this.users_created.push(user);
				process.nextTick(callback);
			}
		);
	}

	check_usernames_unique (callback) {
		this.users_to_add = [...(this.users || []), ...(this.users_created || [])];
		let all_users = [...this.users_to_add, ...this.existing_members];
		let usernames = [];
		let conflicting_username = null;
		let conflict = all_users.find(user => {
			let username = user.get('username');
			if (username) {
				let username_lowercase = username.toLowerCase();
				if (usernames.indexOf(username_lowercase) !== -1) {
					conflicting_username = username;
					return true;
				}
				usernames.push(username_lowercase);
			}
		});
		if (conflict) {
			return callback(this.error_handler.error('username_not_unique', { info: conflicting_username }));
		}
		else {
			return process.nextTick(callback);
		}
	}

	add_to_team (callback) {
		let ids = this.users_to_add.map(user => user.id);
		this.data.teams.apply_op_by_id(
			this.team.id,
			{ add: { member_ids: ids } },
			callback
		);
	}

	update_users (callback) {
		this.updated_users = [];
		this.sanitized_users = [];
		Bound_Async.forEach(
			this,
			this.users_to_add,
			this.update_user,
			callback
		);
	}

	update_user (user, callback) {
		this.data.users.apply_op_by_id(
			user.id,
			{
				add: {
					company_ids: this.team.get('company_id'),
					team_ids: this.team.id
				}
			},
			(error, updated_user) => {
				if (error) { return callback(error); }
				this.updated_users.push(updated_user);
				this.sanitized_users.push(updated_user.get_sanitized_object());
				callback();
			}
		);
	}

	grant_user_messaging_permissions (callback) {
		new Team_Subscription_Granter({
			data: this.data,
			messager: this.api.services.messager,
			team: this.team,
			members: this.users_to_add
		}).grant_to_members(error => {
			if (error) {
				return callback(this.error_handler.error('messaging_grant', { reason: error }));
			}
			callback();
		});
	}
}

module.exports = Add_Team_Members;

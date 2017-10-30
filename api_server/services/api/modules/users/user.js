'use strict';

var CodeStream_Model = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var User_Validator = require('./user_validator');
var Array_Utilities = require(process.env.CS_API_TOP + '/lib/util/array_utilities.js');

class User extends CodeStream_Model {

	get_validator () {
		return new User_Validator();
	}

	pre_save (callback, options) {
		this.attributes.searchable_email = this.attributes.email.toLowerCase();
		if (this.attributes.username) {
			this.attributes.searchable_username = this.attributes.username.toLowerCase();
		}
		super.pre_save(callback, options);
	}

	has_companies (ids) {
		return Array_Utilities.has_all_elements(
			this.get('company_ids') || [],
			ids
		);
	}

	has_company (id) {
		return (this.get('company_ids') || []).indexOf(id) !== -1;
	}

	has_teams (ids) {
		return Array_Utilities.has_all_elements(
			this.get('team_ids') || [],
			ids
		);
	}

	has_team (id) {
		return (this.get('team_ids') || []).indexOf(id) !== -1;
	}

	authorize_model (model_name, id, request, callback) {
		switch (model_name) {
			case 'company':
				return this.authorize_company(id, request, callback);
			case 'team':
				return this.authorize_team(id, request, callback);
			case 'repo':
				return this.authorize_repo(id, request, callback);
			case 'stream':
				return this.authorize_stream(id, request, callback);
			case 'post':
				return this.authorize_post(id, request, callback);
			case 'user':
				return this.authorize_user(id, request, callback);
			default:
				return callback(null, false);
		}
	}

	authorize_company (id, request, callback) {
		return callback(null, this.has_company(id));
	}

	authorize_team (id, request, callback) {
		return callback(null, this.has_team(id));
	}

	authorize_repo (id, request, callback) {
		request.data.repos.get_by_id(
			id,
			(error, repo) => {
				if (error) { return callback(error); }
				if (!repo) {
					return callback(request.error_handler.error('not_found', { info: 'repo' }));
				}
				this.authorize_team(repo.get('team_id'), request, callback);
			}
		);
	}

	authorize_stream (id, request, callback) {
		request.data.streams.get_by_id(
			id,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(request.error_handler.error('not_found', { info: 'stream' }));
				}
				if (
					stream.get('type') !== 'file' &&
					stream.get('member_ids').indexOf(this.id) === -1
				) {
					return callback(null, false);
				}
				this.authorize_team(stream.get('team_id'), request, callback);
			}
		);
	}

	authorize_post (id, request, callback) {
		request.data.posts.get_by_id(
			id,
			(error, post) => {
				if (error) { return callback(error); }
				if (!post) {
					return callback(request.error_handler.error('not_found', { info: 'post' }));
				}
				this.authorize_stream(post.get('stream_id'), request, callback);
			}
		);
	}

	authorize_user (id, request, callback) {
		if (
			id === request.user.id ||
			id.toLowerCase() === 'me'
		) {
			return callback(null, true);
		}
		request.data.users.get_by_id(
			id,
			(error, other_user) => {
				if (error) { return callback(error); }
				if (!other_user) {
					return callback(request.error_handler.error('not_found', { info: 'user' }));
				}
				let authorized = Array_Utilities.has_common_element(
					request.user.get('team_ids') || [],
					other_user.get('team_ids') || []
				);
				return callback(null, authorized);
			}
		);
	}
}

module.exports = User;

'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Post = require('./post');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Stream_Creator = require(process.env.CI_API_TOP + '/services/api/modules/streams/stream_creator');
var Allow = require(process.env.CI_API_TOP + '/lib/util/allow');

class Post_Creator extends Model_Creator {

	get model_class () {
		return Post;
	}

	get collection_name () {
		return 'posts';
	}

	create_post (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	validate_attributes (callback) {
		if (!this.attributes.stream_id && typeof this.attributes.stream !== 'object') {
			return callback(this.error_handler.error('attribute_required', { info: 'stream_id or stream' }));
		}
		process.nextTick(callback);
	}

	allow_attributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['stream_id', 'text', 'commit_sha_when_posted', 'parent_post_id'],
				object: ['stream', 'location', 'replay_info']
			}
		);
		process.nextTick(callback);
	}

	pre_save (callback) {
		this.attributes.creator_id = this.user.id;
		Bound_Async.series(this, [
			this.get_stream,
			this.get_repo,
			this.get_team,
			this.create_stream
		], (error) => {
			if (error) { return callback(error); }
			super.pre_save(callback);
		});
	}

	get_stream (callback) {
		if (!this.attributes.stream_id) {
			return callback();
		}
		this.data.streams.get_by_id(
			this.attributes.stream_id,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.error_handler.error('not_found', { info: 'stream'}));
				}
				this.stream = stream;
				callback();
			}
		);
	}

	get_repo (callback) {
		let repo_id = this.stream ?
			this.stream.get('repo_id') :
			this.attributes.stream.repo_id;
		if (!repo_id) {
			return callback();
		}
		this.data.repos.get_by_id(
			repo_id,
			(error, repo) => {
				if (error) { return callback(error); }
				if (!repo) {
					return callback(this.error_handler.error('not_found', { info: 'repo'}));
				}
				this.repo = repo;
				this.attributes.repo_id = repo.id;
				callback();
			}
		);
	}

	get_team (callback) {
		let team_id;
		if (this.repo) {
			team_id = this.repo.get('team_id');
		}
		else if (this.stream) {
			team_id = this.stream.get('team_id');
		}
		else if (this.attributes.stream) {
			team_id = this.attributes.stream.team_id;
		}
		if (!team_id) {
			return callback(this.error_handler.error('attribute_required', { info: 'team_id' }));
		}
		this.data.teams.get_by_id(
			team_id,
			(error, team) => {
				if (error) { return callback(error); }
				if (!team) {
					return callback(this.error_handler.error('not_found', { info: 'team'}));
				}
				this.team = team;
				this.attributes.team_id = team.id;
				this.attributes.company_id = team.get('company_id');
				callback();
			}
		);
	}

	create_stream (callback) {
		if (this.stream) {
			return callback(); // no need to create
		}
		this.attributes.stream.team_id = this.team.id;
		this.attributes.stream.company_id = this.team.get('company_id');
		new Stream_Creator({
			request: this.request
		}).create_stream(
			this.attributes.stream,
			(error, stream) => {
				if (error) { return callback(error); }
				this.stream = stream;
				this.attributes.stream_id = stream.id;
				this.attach_to_response.stream = this.stream.get_sanitized_object();
				delete this.attributes.stream;
				process.nextTick(callback);
			}
		);
	}
}

module.exports = Post_Creator;

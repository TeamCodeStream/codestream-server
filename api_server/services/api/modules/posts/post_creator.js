'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Post = require('./post');
var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var StreamCreator = require(process.env.CS_API_TOP + '/services/api/modules/streams/stream_creator');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
var LastReadsUpdater = require('./last_reads_updater');

class PostCreator extends ModelCreator {

	get modelClass () {
		return Post;
	}

	get collectionName () {
		return 'posts';
	}

	createPost (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	validateAttributes (callback) {
		if (!this.attributes.streamId && typeof this.attributes.stream !== 'object') {
			return callback(this.errorHandler.error('attributeRequired', { info: 'streamId or stream' }));
		}
		process.nextTick(callback);
	}

	allowAttributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['streamId', 'text', 'commitShaWhenPosted', 'parentPostId'],
				object: ['stream', 'location', 'replayInfo']
			}
		);
		process.nextTick(callback);
	}

	preSave (callback) {
		this.attributes.creatorId = this.user.id;
		BoundAsync.series(this, [
			this.getStream,
			this.getRepo,
			this.getTeam,
			this.createStream,
			this.createId,
			super.preSave,
			this.updateStream,
			this.updateLastReads
		], callback);
	}

	getStream (callback) {
		if (!this.attributes.streamId) {
			return callback();
		}
		this.data.streams.getById(
			this.attributes.streamId,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.errorHandler.error('notFound', { info: 'stream'}));
				}
				this.stream = stream;
				this.previousPostId = stream.get('mostRecentPostId');
				callback();
			}
		);
	}

	getRepo (callback) {
		let repoId = this.stream ?
			this.stream.get('repoId') :
			this.attributes.stream.repoId;
		if (!repoId) {
			return callback();
		}
		this.data.repos.getById(
			repoId,
			(error, repo) => {
				if (error) { return callback(error); }
				if (!repo) {
					return callback(this.errorHandler.error('notFound', { info: 'repo'}));
				}
				this.repo = repo;
				this.attributes.repoId = repo.id;
				callback();
			}
		);
	}

	getTeam (callback) {
		let teamId;
		if (this.repo) {
			teamId = this.repo.get('teamId');
		}
		else if (this.stream) {
			teamId = this.stream.get('teamId');
		}
		else if (this.attributes.stream) {
			teamId = this.attributes.stream.teamId;
		}
		if (!teamId) {
			return callback(this.errorHandler.error('attributeRequired', { info: 'teamId' }));
		}
		this.data.teams.getById(
			teamId,
			(error, team) => {
				if (error) { return callback(error); }
				if (!team) {
					return callback(this.errorHandler.error('notFound', { info: 'team'}));
				}
				this.team = team;
				this.attributes.teamId = team.id;
				callback();
			}
		);
	}

	createStream (callback) {
		if (this.stream) {
			return callback(); // no need to create
		}
		this.attributes.stream.teamId = this.team.id;
		new StreamCreator({
			request: this.request
		}).createStream(
			this.attributes.stream,
			(error, stream) => {
				if (error) { return callback(error); }
				this.stream = stream;
				this.attributes.streamId = stream.id;
				this.attachToResponse.stream = this.stream.getSanitizedObject();
				delete this.attributes.stream;
				process.nextTick(callback);
			}
		);
	}

	createId (callback) {
		this.attributes._id = this.data.posts.createId();
		callback();
	}

	updateStream (callback) {
		let op = {
			$set: {
				mostRecentPostId: this.attributes._id,
				sortId: this.attributes._id
			}
		};
		this.data.streams.applyOpById(
			this.model.get('streamId'),
			op,
			callback
		);
	}

	updateLastReads (callback) {
		new LastReadsUpdater({
			data: this.data,
			user: this.user,
			stream: this.stream,
			team: this.team,
			previousPostId: this.previousPostId,
			logger: this
		}).updateLastReads(callback);
	}
}

module.exports = PostCreator;

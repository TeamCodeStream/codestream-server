'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Post = require('./post');
var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var StreamCreator = require(process.env.CS_API_TOP + '/services/api/modules/streams/stream_creator');
var MarkerCreator = require(process.env.CS_API_TOP + '/services/api/modules/markers/marker_creator');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
var LastReadsUpdater = require('./last_reads_updater');
const PostAttributes = require('./post_attributes');

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
		if (this.attributes.codeBlocks && !this.attributes.commitHashWhenPosted) {
			return callback(this.errorHandler.error('attributeRequired', { info: 'commitHashWhenPosted' }));
		}
		if (this.attributes.codeBlocks) {
			this.validateCodeBlocks(callback);
		}
		else {
			callback();
		}
	}

	validateCodeBlocks (callback) {
		let result = new Post().validator.validateArrayOfObjects(
			this.attributes.codeBlocks,
			PostAttributes.codeBlocks
		);
		if (result) {
			return callback(this.errorHandler.error('validation', { info: `codeBlocks: ${result}` }));
		}
		BoundAsync.forEachSeries(
			this,
			this.attributes.codeBlocks,
			this.validateCodeBlock,
			error => {
				if (error) {
					return callback(this.errorHandler.error('validation', { info: `codeBlocks: ${error}` }));
				}
				else {
					callback();
				}
			}
		);
	}

	validateCodeBlock (codeBlock, callback) {
		let numKeys = 2;
		if (typeof codeBlock.code !== 'string') {
			return callback('code must be a string');
		}
		let result = MarkerCreator.validateLocation(codeBlock.location);
		if (result) {
			return callback(result);
		}
		if (codeBlock.streamId) {
			numKeys++;
			let result = new Post().validator.validateId(codeBlock.streamId);
			if (result) {
				return callback('streamId is not a valid ID');
			}
		}
		if (Object.keys(codeBlock).length > numKeys) {
			return callback('improper attributes');
		}
		process.nextTick(callback);
	}

	allowAttributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['streamId', 'text', 'commitHashWhenPosted', 'parentPostId'],
				object: ['stream'],
				'array(object)': ['codeBlocks']
			}
		);
		process.nextTick(callback);
	}

	preSave (callback) {
		if (this.attributes.commitHashWhenPosted) {
			this.attributes.commitHashWhenPosted = this.attributes.commitHashWhenPosted.toLowerCase();
		}
		this.attributes.creatorId = this.user.id;
		BoundAsync.series(this, [
			this.getStream,
			this.getRepo,
			this.getTeam,
			this.createStream,
			this.createId,
			this.createMarkers,
			this.getSeqNum,
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
				this.createdStream = true;
				process.nextTick(callback);
			}
		);
	}

	createId (callback) {
		this.attributes._id = this.data.posts.createId();
		callback();
	}

	createMarkers (callback) {
		if (!this.attributes.codeBlocks) {
			return callback();
		}
		this.markers = [];
		this.attachToResponse.markers = [];
		this.attachToResponse.markerLocations = {
			teamId: this.attributes.teamId,
			streamId: this.attributes.streamId,
			commitHash: this.attributes.commitHashWhenPosted,
			locations: {}
		};
		BoundAsync.forEachLimit(
			this,
			this.attributes.codeBlocks,
			10,
			this.createMarker,
			callback
		);
	}

	createMarker (codeBlock, callback) {
		let markerInfo = {
			teamId: this.attributes.teamId,
			streamId: codeBlock.streamId || this.attributes.streamId,
			postId: this.attributes._id,
			commitHash: this.attributes.commitHashWhenPosted,
			location: codeBlock.location
		};
		new MarkerCreator({
			request: this.request
		}).createMarker(
			markerInfo,
			(error, marker) => {
				if (error) { return callback(error); }
				this.markers.push(marker);
				codeBlock.markerId = marker.id;
				delete codeBlock.streamId; // gets put into the marker
				let markerObject = marker.getSanitizedObject();
				this.attachToResponse.markers.push(markerObject);
				this.attachToResponse.markerLocations.locations[marker.id] = codeBlock.location;
				delete codeBlock.location; // gets put into the marker locations object
				process.nextTick(callback);
			}
		);
	}

	getSeqNum (callback) {
		if (this.createdStream) {
			this.attributes.seqNum = 1;
			return callback();
		}
		let seqNum = null;
		let numRetries = 0;
		let gotError = null;
		BoundAsync.whilst(
			this,
			() => {
				return !seqNum && numRetries < 20;
			},
			(whilstCallback) => {
				this.data.streams.findAndModify(
					{ _id: this.data.streams.objectIdSafe(this.attributes.streamId) },
					{ $inc: { nextSeqNum: 1 } },
					(error, foundStream) => {
						if (error) {
							numRetries++;
							gotError = error;
						}
						else {
							gotError = null;
							seqNum = foundStream.nextSeqNum;
						}
					 	process.nextTick(whilstCallback);
					},
					{
						databaseOptions: {
							fields: { nextSeqNum: 1 }
						}
					}
				);
			},
			() => {
				if (!gotError) {
					this.attributes.seqNum = seqNum;
				}
				callback(gotError);
			}
		);
	}

	updateStream (callback) {
		let op = {
			$set: {
				mostRecentPostId: this.attributes._id,
				sortId: this.attributes._id
			}
		};
		if (this.markers && this.markers.length) {
			op.$inc = { numMarkers: this.markers.length };
		}
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

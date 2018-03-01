// provides a request class for handling the PUT /editing request, indicating a
// user is currently editing a given file

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const StreamCreator = require('./stream_creator');
const Indexes = require('./indexes');
const Errors = require('./errors');

class EditingRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.fetchedStreams = [];
		this.foundStreams = [];
		this.createdStreams = [];
	}

	// authorize the current user against the request
	authorize (callback) {
		// must be a member of the team specified in the request
		this.user.authorizeFromTeamId(this.request.body, this, callback, { error: 'updateAuth' });
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.requireAllow,
			this.normalize,
			this.fetchStreams,
			this.findStreams,
			this.createStreams,
			this.fetchStreamsBeingEdited,
			this.setNewStreamsBeingEdited,
			this.setStreamsNoLongerBeingEdited,
			this.saveStreamsBeingEdited,
			this.saveStreamsNoLongerBeingEdited,
			this.setResponseData
		], callback);
	}

	// these parameters are required for the request
	requireAllow (callback) {
		if (typeof this.request.body.editing !== 'undefined' && typeof this.request.body.editing !== 'object') {
			if (this.request.body.editing) {
				this.request.body.editing = {};
			}
			else {
				this.request.body.editing = { __remove: true };
			}
		}
		this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'repoId'],
					'object': ['editing']
				},
				optional: {
					'string': ['file', 'streamId'],
					'array(string)': ['files', 'streamIds']
				}
			},
			callback
		);
	}

	// normalize input body for further processing
	normalize (callback) {
		this.teamId = this.request.body.teamId.toLowerCase();
		this.repoId = this.request.body.repoId.toLowerCase();
		// user may specify a single file by stream ID or by filename, or
		// multiple files by stream ID or filename ... if they specify
		// multiple files, we assume they are providing a complete list of
		// files being edited, and we will remove that they are editing
		// any other files in the same repo
		if (this.request.body.files || this.request.body.streamIds) {
			// multiple files, but...
			if (this.request.body.editing === false) {
				// if editing is false, it means the user is editing nothing
				this.files = [];
				this.streamIds = [];
			}
			else {
				// otherwise normalize the input files
				this.files = this.request.body.files || [];
				this.streamIds = (this.request.body.streamIds || []).map(streamId => streamId.toLowerCase());
			}
			this.isCompleteList = true;	// user is providing a complete list of files they are editing
		}
		else if (this.request.body.streamId) {
			// user provided a single file by stream ID
			this.streamIds = [this.request.body.streamId.toLowerCase()];
			this.files = [];
		}
		else if (this.request.body.file) {
			// user provided a single file by filename
			this.files = [this.request.body.file];
			this.streamIds = [];
		}
		else {
			return callback(this.errorHandler.error('parameterRequired', { info: 'streamId or file or streamIds or files ' }));
		}
		// we won't allow this request to get too big, users with more than 100 files
		// to delcare should spread it out over multiple requests
		if (this.files.length + this.streamIds.length > 100) {
			return callback(this.errorHandler.error('tooManyFiles'));
		}
		this.editing = this.request.body.editing;
		if (!this.editing.__remove) {
			this.editing.startedAt = Date.now();
		}
		process.nextTick(callback);
	}

	// fetch the streams for which we have a stream ID
	fetchStreams (callback) {
		if (this.streamIds.length === 0) {
			return callback();
		}
		this.data.streams.getByIds(
			this.streamIds,
			(error, streams) => {
				if (error) { return callback(error); }
				// only allow editing to be set for file-type streams in the same team and repo
				this.fetchedStreams = streams.filter(stream => {
					return (
						stream.get('type') === 'file' &&
						stream.get('repoId') === this.repoId &&
						stream.get('teamId') === this.teamId
					);
				});
				callback();
			}
		);
	}

	// find any streams that are specified by filename, within the same team and repo
	findStreams (callback) {
		if (this.files.length === 0) {
			return callback();
		}
		const query = {
			teamId: this.teamId,
			repoId: this.repoId,
			file: { $in: this.files }
		};
		this.data.streams.getByQuery(
			query,
			(error, streams) => {
				if (error) { return callback(error); }
				this.foundStreams = streams;
				this.foundFiles = this.foundStreams.map(stream => stream.get('file'));
				callback();
			},
			{
				databaseOptions: {
					hint: Indexes.byFile
				}
			}
		);
	}

	// create any streams for filenames we didn't find streams for
	createStreams (callback) {
		if (
			this.editing.__remove ||	 // we're removing that the user is editing these, so don't create any files
			(
				this.files.length > 0 &&
				this.files.length === this.foundFiles.length	// a shortcut ... we found all the files we needed
			)
		) {
			return callback();
		}
		this.streamsToCreate = this.files.filter(file => {
			return !this.foundFiles.includes(file);
		});
		if (this.streamsToCreate.length === 0) {
			return callback();
		}
		BoundAsync.forEachLimit(
			this,
			this.streamsToCreate,
			10,
			this.createStream,
			callback
		);
	}

	// create a stream for a file, and indicate that the user is editing this file
	createStream (file, callback) {
		const editingUsers = {
			[this.user.id]: this.editing
		};
		const streamAttributes = {
			teamId: this.teamId,
			repoId: this.repoId,
			type: 'file',
			file: file
		};
		new StreamCreator({
			request: this,
			editingUsers: editingUsers
		}).createStream(
			streamAttributes,
			(error, stream) => {
				if (error) { return callback(error); }
				this.createdStreams.push(stream);
				callback();
			}
		);
	}

	// fetch the streams that are currently indicated as being edited by the user
	fetchStreamsBeingEdited (callback) {
		if (!this.isCompleteList) {
			// since the user did not provide a complete list of files being edited,
			// we'll simply check against those streams we already have, which should
			// really just be one
			this.streamsPreviouslyBeingEdited = [...this.fetchedStreams, ...this.foundStreams].filter(stream => {
				return (stream.get('editingUsers') || {})[this.user.id];
			});
			return callback();
		}
		const query = {
			teamId: this.teamId,
			repoId: this.repoId,
			[`editingUsers.${this.user.id}`]: { $exists: true }
		};
		this.data.streams.getByQuery(
			query,
			(error, streams) => {
				if (error) { return callback(error); }
				this.streamsPreviouslyBeingEdited = streams;
				callback();
			},
			{
				databaseOptions: {
					hint: Indexes.byFile
				}
			}
		);
	}

	// find any streams that the user says they are editing, and which are not already
	// being edited by this user
	setNewStreamsBeingEdited (callback) {
		if (this.editing.__remove) {
			// really specifying to remove that the user is editing, so nothing to do here
			this.newStreamsBeingEdited = [];
			return callback();
		}
		// among fetched and found streams, look for any that are not indicated as
		// already being edited by this user
		const streamsBeingEdited = [...this.fetchedStreams, ...this.foundStreams];
		this.newStreamsBeingEdited = streamsBeingEdited.reduce((streams, stream) => {
			if (!this.streamsPreviouslyBeingEdited.find(editedStream => editedStream.id === stream.id)) {
				streams.push(stream.id);
			}
			return streams;
		}, []);
		process.nextTick(callback);
	}

	// if the user is providing a complete list of files they are editing, then  among the
	// streams the user is already known to be editing, find those that the user is not
	// saying they are still editing, we'll make these as no longer being edited by the user
	setStreamsNoLongerBeingEdited (callback) {
		if (!this.isCompleteList) {
			// user is not specifying a complete list of files being edited, so the ones
			// no longer being edited are limited to the ones we already have, which should just be one
			if (this.editing.__remove) {
				this.streamsNoLongerBeingEdited = [...this.fetchedStreams, ...this.foundStreams].map(stream => stream.id);
			}
			else {
				this.streamsNoLongerBeingEdited = [];
			}
			return callback();
		}
		// among fetched and found streams, look for any that are not indicated as
		// being edited anymore, we'll set these as not being edited by the user
		const streamsBeingEdited = [...this.fetchedStreams, ...this.foundStreams];
		this.streamsNoLongerBeingEdited = this.streamsPreviouslyBeingEdited.reduce((streams, stream) => {
			if (!streamsBeingEdited.find(editedStream => editedStream.id === stream.id)) {
				streams.push(stream.id);
			}
			return streams;
		}, []);
		process.nextTick(callback);
	}

	// in a single update query, mark all the streams the user is editing that
	// they weren't editing already
	saveStreamsBeingEdited (callback) {
		this.beingEditedOp = {
			$set: {
				[`editingUsers.${this.user.id}`]: this.editing,
				modifiedAt: Date.now()
			}
		};
		if (this.newStreamsBeingEdited.length === 0) {
			return callback();
		}
		const query = {
			_id: this.data.streams.inQuerySafe(this.newStreamsBeingEdited)
		};
		this.data.streams.updateDirect(
			query,
			this.beingEditedOp,
			callback
		);
	}

	// in a single update query, mark all the streams that the user is no longer editing
	saveStreamsNoLongerBeingEdited (callback) {
		this.noLongerBeingEditedOp = {
			$set: {
				modifiedAt: Date.now()
			},
			$unset: {
				[`editingUsers.${this.user.id}`]: true
			}
		};
		if (this.streamsNoLongerBeingEdited.length === 0) {
			return callback();
		}
		const query = {
			_id: this.data.streams.inQuerySafe(this.streamsNoLongerBeingEdited)
		};
		this.data.streams.updateDirect(
			query,
			this.noLongerBeingEditedOp,
			callback
		);
	}

	// set the data to return in the request response
	setResponseData (callback) {
		this.responseData.streams = [];
		// created streams are returned in full
		this.createdStreams.forEach(stream => {
			this.responseData.streams.push(stream.getSanitizedObject());
		});
		// new streams the user is editing, indicated as such
		this.newStreamsBeingEdited.forEach(streamId => {
			this.responseData.streams.push(Object.assign({}, {
				_id: streamId
			}, this.beingEditedOp));
		});
		// streams the user is no longer editing, indicated as such
		this.streamsNoLongerBeingEdited.forEach(streamId => {
			this.responseData.streams.push(Object.assign({}, {
				_id: streamId
			}, this.noLongerBeingEditedOp));
		});
		process.nextTick(callback);
	}

	// after the response is sent...
	postProcess (callback) {
		if (this.responseData.streams.length === 0) {
			return callback();
		}
		// send a message to the team indicating the changed status of all the
		// streams the user is now editing, or no longer editing, including
		// any streams created
		const channel = 'team-' + this.teamId;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.request.warn(`Could not publish edited streams message to team ${this.teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = EditingRequest;

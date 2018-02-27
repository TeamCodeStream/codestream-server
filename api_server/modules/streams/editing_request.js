// provides a request class for handling the PUT /editing request, indicating a
// user is currently editing a given file

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const StreamPublisher = require('./stream_publisher');
const StreamCreator = require('./stream_creator');
const Indexes = require('./indexes');
const Errors = require('./errors');

class EditingRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
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
			this.getOrFindStream,
			this.confirmTeamAndRepo,
			this.createStream,
			this.setEditing,
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
					'object': ['all'],
					'string': ['file', 'streamId']
				}
			},
			callback
		);
	}

	// normalize input body for further processing
	normalize (callback) {
		this.teamId = this.request.body.teamId.toLowerCase();
		this.repoId = this.request.body.repoId.toLowerCase();
		if (this.request.body.streamId) {
			this.streamId = this.request.body.streamId.toLowerCase();
		}
		this.editing = this.request.body.editing;
		this.file = this.request.body.file;
		process.nextTick(callback);
	}

	// if streamId specified, get the stream, otherwise look for a stream matching the file
	getOrFindStream (callback) {
		if (this.streamId) {
			this.getStream(callback);
		}
		else if (this.file) {
			this.findStream(callback);
		}
		else {
			return callback(this.errorHandler.error('parameterRequired', { info: 'file or streamId'}));
		}
	}

	// get the stream specified by streamId
	getStream (callback) {
		this.data.streams.getById(
			this.streamId,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.errorHandler.error('notFound', { info: 'stream' }));
				}
				if (stream.get('type') !== 'file') {
					return callback(this.errorHandler.error('noEditingNonFile'));
				}
				this.stream = stream;
				callback();
			}
		);
	}

	// find a stream matching the specified file
	findStream (callback) {
		const query = {
			teamId: this.teamId,
			repoId: this.repoId,
			type: 'file',
			file: this.file
		};
		this.data.streams.getByQuery(
			query,
			(error, streams) => {
				if (error) { return callback(error); }
				if (streams.length > 0) {
					this.stream = streams[0];
				}
				callback();
			},
			{
				databaseOptions: {
					hint: Indexes.byFile
				}
			}
		);
	}

	// the stream we have must match the teamId and repoId specified in the request
	confirmTeamAndRepo (callback) {
		if (!this.stream) {
			return callback();
		}
		else if (
			this.stream.get('teamId') !== this.teamId ||
			this.stream.get('repoId') !== this.repoId
		) {
			return callback(this.errorHandler.error('updateAuth'));
		}
		else {
			return callback();
		}
	}

	// if we didn't find a stream matching the file, create one as needed
	createStream (callback) {
		if (this.stream || this.editing.__remove) {
			// already have a stream, no need to create, or the user specified a file
			// that they are no longer editing, but we don't have a stream for that file
			// anyway, so it's really a no-op
			return callback();
		}
		this.editing.startedAt = Date.now();
		const editingUsers = {
			[this.user.id]: this.editing
		};
		const streamAttributes = {
			teamId: this.teamId,
			repoId: this.repoId,
			type: 'file',
			file: this.file
		};
		new StreamCreator({
			request: this,
			editingUsers: editingUsers
		}).createStream(
			streamAttributes,
			(error, stream) => {
				if (error) { return callback(error); }
				this.stream = stream;
				this.createdStream = true;
				callback();
			}
		);
	}

	// set editingUsers for the current user as needed, assuming an existing stream
	setEditing (callback) {
		// if we created a stream, we set the editingUsers attribute when we created it,
		// or if we don't have a stream, that means there was no match to the file, and the user isn't
		// really editing it, so it's a no-op
		if (this.createdStream || !this.stream) {
			return callback();
		}

		// if we're setting that the user is editing the stream, and they've already
		// set this, we don't override the existing setting
		if (
			!this.editing.__remove &&
			(this.stream.get('editingUsers') || {})[this.user.id]
		) {
			this.alreadyEditing = true;
			return callback();
		}

		// unset the user's entry in editingUsers if they are no longer editing the file
		if (this.editing.__remove) {
			this.op = {
				$unset: {
					[`editingUsers.${this.user.id}`]: true
				}
			};
		}

		// otherwise set the user's entry given the free-form parameters passed in
		else {
			this.editing.startedAt = Date.now();
			this.op = {
				$set: {
					[`editingUsers.${this.user.id}`]: this.editing
				}
			};
		}

		// modifiedAt must be set
		this.op.$set = this.op.$set || {};
		this.op.$set.modifiedAt = Date.now();

		// and apply...
		this.data.streams.applyOpById(
			this.stream.id,
			this.op,
			callback
		);
	}

	// set the data to return in the request response
	setResponseData (callback) {
		if (this.createdStream) {
			// we created a stream, return that
			this.responseData = { stream: this.stream.getSanitizedObject() };
		}
		else if (this.op) {
			// we modified an existing stream, return the op we used
			this.responseData = {
				stream: this.op
			};
		}
		else {
			// we neither created nor found a stream, this is a no-op
			this.responseData = {};
		}
		callback();
	}

	// after the response is sent...
	postProcess (callback) {
		if (!this.stream || this.alreadyEditing) {
			// we neither created nor found a stream, or the user is already editing,
			// this is a no-op, so there is no message to send
			return callback();
		}
		// publish the stream to the appropriate messager channel
		new StreamPublisher({
			data: this.responseData,
			stream: this.stream.attributes,
			request: this,
			messager: this.api.services.messager
		}).publishStream(callback);
	}
}

module.exports = EditingRequest;

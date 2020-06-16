// provides a request class for handling the PUT /editing request, indicating a
// user is currently editing a given file

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
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
	async authorize () {
		// must be a member of the team specified in the request
		await this.user.authorizeFromTeamId(this.request.body, this, { error: 'updateAuth' });
	}

	// process the request...
	async process () {
		await this.requireAllow();
		await this.normalize();
		await this.fetchStreams();
		await this.findStreams();
		await this.createStreams();
		await this.fetchStreamsBeingEdited();
		await this.setNewStreamsBeingEdited();
		await this.setStreamsNoLongerBeingEdited();
		await this.saveStreamsBeingEdited();
		await this.saveStreamsNoLongerBeingEdited();
		await this.setResponseData();
	}

	// these parameters are required for the request
	async requireAllow () {
		if (typeof this.request.body.editing !== 'undefined' && typeof this.request.body.editing !== 'object') {
			if (this.request.body.editing) {
				this.request.body.editing = {};
			}
			else {
				this.request.body.editing = { __remove: true };
			}
		}
		await this.requireAllowParameters(
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
			}
		);
	}

	// normalize input body for further processing
	async normalize () {
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
			throw this.errorHandler.error('parameterRequired', { info: 'streamId or file or streamIds or files ' });
		}
		// we won't allow this request to get too big, users with more than 100 files
		// to delcare should spread it out over multiple requests
		if (this.files.length + this.streamIds.length > 100) {
			throw this.errorHandler.error('tooManyFiles');
		}
		this.editing = this.request.body.editing;
		if (!this.editing.__remove) {
			this.editing.startedAt = Date.now();
		}
	}

	// fetch the streams for which we have a stream ID
	async fetchStreams () {
		if (this.streamIds.length === 0) {
			return;
		}
		const streams = await this.data.streams.getByIds(this.streamIds);
		// only allow editing to be set for file-type streams in the same team and repo
		this.fetchedStreams = streams.filter(stream => {
			return (
				stream.get('type') === 'file' &&
				stream.get('repoId') === this.repoId &&
				stream.get('teamId') === this.teamId
			);
		});
	}

	// find any streams that are specified by filename, within the same team and repo
	async findStreams () {
		if (this.files.length === 0) {
			return;
		}
		const query = {
			teamId: this.teamId,
			repoId: this.repoId,
			file: { $in: this.files }
		};
		this.foundStreams = await this.data.streams.getByQuery(
			query,
			{ hint: Indexes.byFile }
		);
		this.foundFiles = this.foundStreams.map(stream => stream.get('file'));
	}

	// create any streams for filenames we didn't find streams for
	async createStreams () {
		if (
			this.editing.__remove ||	 // we're removing that the user is editing these, so don't create any files
			(
				this.files.length > 0 &&
				this.files.length === this.foundFiles.length	// a shortcut ... we found all the files we needed
			)
		) {
			return;
		}
		this.streamsToCreate = this.files.filter(file => {
			return !this.foundFiles.includes(file);
		});
		if (this.streamsToCreate.length === 0) {
			return;
		}
		await Promise.all(this.streamsToCreate.map(async file => {
			await this.createStream(file);
		}));
	}

	// create a stream for a file, and indicate that the user is editing this file
	async createStream (file) {
		const editingUsers = {
			[this.user.id]: this.editing
		};
		const streamAttributes = {
			teamId: this.teamId,
			repoId: this.repoId,
			type: 'file',
			file: file
		};
		const stream = await new StreamCreator({
			request: this,
			editingUsers: editingUsers
		}).createStream(streamAttributes);
		this.createdStreams.push(stream);
	}

	// fetch the streams that are currently indicated as being edited by the user
	async fetchStreamsBeingEdited () {
		if (!this.isCompleteList) {
			// since the user did not provide a complete list of files being edited,
			// we'll simply check against those streams we already have, which should
			// really just be one
			this.streamsPreviouslyBeingEdited = [...this.fetchedStreams, ...this.foundStreams].filter(stream => {
				return (stream.get('editingUsers') || {})[this.user.id];
			});
			return;
		}
		const query = {
			teamId: this.teamId,
			repoId: this.repoId,
			[`editingUsers.${this.user.id}`]: { $exists: true }
		};
		this.streamsPreviouslyBeingEdited = await this.data.streams.getByQuery(
			query,
			{ hint: Indexes.byFile }
		);
	}

	// find any streams that the user says they are editing, and which are not already
	// being edited by this user
	async setNewStreamsBeingEdited () {
		if (this.editing.__remove) {
			// really specifying to remove that the user is editing, so nothing to do here
			this.newStreamsBeingEdited = [];
			return;
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
	}

	// if the user is providing a complete list of files they are editing, then  among the
	// streams the user is already known to be editing, find those that the user is not
	// saying they are still editing, we'll make these as no longer being edited by the user
	async setStreamsNoLongerBeingEdited () {
		if (!this.isCompleteList) {
			// user is not specifying a complete list of files being edited, so the ones
			// no longer being edited are limited to the ones we already have, which should just be one
			if (this.editing.__remove) {
				this.streamsNoLongerBeingEdited = [...this.fetchedStreams, ...this.foundStreams].map(stream => stream.id);
			}
			else {
				this.streamsNoLongerBeingEdited = [];
			}
			return;
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
	}

	// in a single update query, mark all the streams the user is editing that
	// they weren't editing already
	async saveStreamsBeingEdited () {
		this.beingEditedOp = {
			$set: {
				[`editingUsers.${this.user.id}`]: this.editing,
				modifiedAt: Date.now()
			}
		};
		if (this.newStreamsBeingEdited.length === 0) {
			return;
		}
		const query = {
			id: this.data.streams.inQuerySafe(this.newStreamsBeingEdited)
		};
		await this.data.streams.updateDirect(
			query,
			this.beingEditedOp
		);
	}

	// in a single update query, mark all the streams that the user is no longer editing
	async saveStreamsNoLongerBeingEdited () {
		this.noLongerBeingEditedOp = {
			$set: {
				modifiedAt: Date.now()
			},
			$unset: {
				[`editingUsers.${this.user.id}`]: true
			}
		};
		if (this.streamsNoLongerBeingEdited.length === 0) {
			return ;
		}
		const query = {
			id: this.data.streams.inQuerySafe(this.streamsNoLongerBeingEdited)
		};
		await this.data.streams.updateDirect(
			query,
			this.noLongerBeingEditedOp
		);
	}

	// set the data to return in the request response
	async setResponseData () {
		this.responseData.streams = [];
		// created streams are returned in full
		this.createdStreams.forEach(stream => {
			this.responseData.streams.push(stream.getSanitizedObject({ request: this }));
		});
		// new streams the user is editing, indicated as such
		this.newStreamsBeingEdited.forEach(streamId => {
			this.responseData.streams.push(Object.assign({}, {
				id: streamId,
				_id: streamId	// DEPRECATE ME
			}, this.beingEditedOp));
		});
		// streams the user is no longer editing, indicated as such
		this.streamsNoLongerBeingEdited.forEach(streamId => {
			this.responseData.streams.push(Object.assign({}, {
				id: streamId,
				_id: streamId	// DEPRECATE ME
			}, this.noLongerBeingEditedOp));
		});
	}

	// after the response is sent...
	async postProcess () {
		if (this.responseData.streams.length === 0) {
			return;
		}
		// send a message to the team indicating the changed status of all the
		// streams the user is now editing, or no longer editing, including
		// any streams created
		const channel = 'team-' + this.teamId;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish edited streams message to team ${this.teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'editing',
			summary: 'Declares that the user is editing, or not editing, a set of files belonging to a repo',
			access: 'User must be a member of the team that owns the given repo',
			description: 'The server maintains a list of files that each user is actively editing within a given repo. Updating this list can be done on a per-file basis, by calling this route with a single file specified, and whether it is being edited or not; this will update the editing status for the given file. All files that the user is editing can also be declared by sending an array of files; in this case, the editing status for any files not on the list will be cleared.',
			input: {
				summary: 'Specify parameters in the body',
				looksLike: {
					'teamId*': '<ID of the team that owns the repo for which files are being declared>',
					'repoId*': '<ID of the repo for which files are being declared>',
					'editing': '<Can be a boolean indicating the given file(s) is being edited or not being edited, or can be an info structure providing additional data>',
					'file': '<If specified, user is declaring that they are editing or not editing the given file>',
					'streamId': '<If specified, user is declaring that they are editing or not editing the file associated with the given stream>',
					'files': '<Array of files the user is editing; the editing status for all other files in the repo will be cleared for that user>',
					'streamIds': '<Array of files, associated with the given streams, that the user is editing; the editing status for all other files in the repo will be cleared for that user>'
				}
			},
			returns: {
				summary: 'An array of stream objects, with directives indicating how to adjust the editingUsers object for each stream affected',
				looksLike: {
					streams: [
						'<@@#stream object#stream@@ > (will have directives indicating adjustments to the editingUsers attribute of the stream)',
						'...'
					]
				}
			},
			publishes: {
				summary: 'Will publish the response data on the team channel for the team that owns the repo',
				looksLike: {
					streams: [
						'<@@#stream object#stream@@ > (will have directives indicating adjustments to the editingUsers attribute of the stream)',
						'...'
					]
				}
			},
			errors: [
				'updateAuth',
				'parameterRequired',
				'tooManyFiles'
			]
		};
	}
}

module.exports = EditingRequest;

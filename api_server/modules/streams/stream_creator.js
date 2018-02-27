// this class should be used to create all stream documents in the database

'use strict';

var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Stream = require('./stream');
var StreamSubscriptionGranter = require('./stream_subscription_granter');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const StreamTypes = require('./stream_types');
const Errors = require('./errors');
const Indexes = require('./indexes');

class StreamCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.dontSaveIfExists = true;	// if a matching stream exists, don't save, but just return the existing stream
	}

	get modelClass () {
		return Stream;	// class to use to create a stream model
	}

	get collectionName () {
		return 'streams';	// data collection to use
	}

	// convenience wrapper
	createStream (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	// get attributes that are required for stream creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'type']
			},
			optional: {
				string: ['repoId', 'type', 'file', 'name'],
				'array(string)': ['memberIds']
			}
		};
	}

	// validate attributes for the stream we are creating
	validateAttributes (callback) {
		this.ensureUserIsMember();	// user must be a member of a direct or channel stream
		this.attributes.type = this.attributes.type.toLowerCase();	// enforce lower-case on the stream type
		if (StreamTypes.indexOf(this.attributes.type) === -1) {
			// only allow recognized stream types
			return callback(this.errorHandler.error('invalidStreamType', { info: this.attributes.type }));
		}
		if (this.attributes.type === 'channel') {
			// channel streams must have a name
			if (!this.attributes.name) {
				return callback(this.errorHandler.error('nameRequired'));
			}
			// channel streams ingore file and repo ID
			delete this.attributes.file;
			delete this.attributes.repoId;
		}
		else if (this.attributes.type === 'file') {
			// file-type streams must have a repo ID and file
			if (!this.attributes.repoId) {
				return callback(this.errorHandler.error('repoIdRequired'));
			}
			else if (!this.attributes.file) {
				return callback(this.errorHandler.error('fileRequired'));
			}
			// file-type stream ignore name and members
			delete this.attributes.name;
			delete this.attributes.memberIds;
		}
		else if (this.attributes.type === 'direct') {
			// direct streams ignore file, repo ID, and name
			delete this.attributes.file;
			delete this.attributes.repoId;
			delete this.attributes.name;
		}
		process.nextTick(callback);
	}

	// ensure the user making the request is a member of channel or direct streams
	ensureUserIsMember () {
		if (this.attributes.type === 'file') {
			return; // not required for files
		}
		this.attributes.memberIds = this.attributes.memberIds || [this.user.id];
		if (!(this.attributes.memberIds instanceof Array)) {
			// this will get caught later
			return;
		}
		if (this.attributes.memberIds.indexOf(this.user.id) === -1) {
			this.attributes.memberIds.push(this.user.id);
		}
		this.attributes.memberIds.sort();
	}

	// return database query to check if a matching stream already exists
	checkExistingQuery () {
		let query = {
			teamId: this.attributes.teamId,
			type: this.attributes.type
		};
		let hint;
		if (this.attributes.type === 'channel') {
			// channel streams match by name
			query.name = this.attributes.name;
			hint = Indexes.byName;
		}
		else if (this.attributes.type === 'direct') {
			// direct stream match by membership
			query.memberIds = this.attributes.memberIds;
			hint = Indexes.byMemberIds;
		}
		else if (this.attributes.type === 'file') {
			// file stream match by repo and file
			query.repoId = this.attributes.repoId;
			query.file = this.attributes.file;
			hint = Indexes.byFile;
		}
		return { query, hint };
	}

	// return whether a matching stream can exist or if an error should be returned
	modelCanExist () {
		// matching file-type streams and direct streams are permitted, but not channel streams
		return this.attributes.type !== 'channel';
	}

	// called before the stream is actually saved
	preSave (callback) {
		this.attributes.creatorId = this.user.id;	// user making the request is the stream creator
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		if (!this.existingModel) {
			// for new streams, set next sequence number for posts to 1, unless provided from the outside
			this.attributes.nextSeqNum = this.nextSeqNum || 1;
			if (this.editingUsers) {
				this.attributes.editingUsers = this.editingUsers;	// not user-definable, but the server can provide it
			}
		}
		BoundAsync.series(this, [
			this.createId,
			super.preSave
		], callback);
	}

	// requisition an ID for the post
	createId (callback) {
		this.attributes._id = this.attributes.sortId = this.data.streams.createId();
		callback();
	}

	// after the stream has been saved
	postSave (callback) {
		// grant permission to the members of the stream to subscribe to the stream's messager channel
		this.grantUserMessagingPermissions(callback);
	}

	// grant permission to the members of the stream to subscribe to the stream's messager channel
	grantUserMessagingPermissions (callback) {
		if (!this.model.get('memberIds')) {
			return callback();	// no need to grant permissions for file-type stream, these get team-level messages
		}
		new StreamSubscriptionGranter({
			data: this.data,
			messager: this.api.services.messager,
			stream: this.model,
			request: this.request
		}).grantToMembers(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}

}

module.exports = StreamCreator;

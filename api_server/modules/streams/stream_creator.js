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
		this.dontSaveIfExists = true;
	}

	get modelClass () {
		return Stream;
	}

	get collectionName () {
		return 'streams';
	}

	createStream (attributes, callback) {
		return this.createModel(attributes, callback);
	}

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

	validateAttributes (callback) {
		this.ensureUserIsMember();
		this.attributes.type = this.attributes.type.toLowerCase();
		if (StreamTypes.indexOf(this.attributes.type) === -1) {
			return callback(this.errorHandler.error('invalidStreamType', { info: this.attributes.type }));
		}
		if (this.attributes.type === 'channel') {
			if (!this.attributes.name) {
				return callback(this.errorHandler.error('nameRequired'));
			}
			delete this.attributes.file;
			delete this.attributes.repoId;
		}
		else if (this.attributes.type === 'file') {
			if (!this.attributes.repoId) {
				return callback(this.errorHandler.error('repoIdRequired'));
			}
			else if (!this.attributes.file) {
				return callback(this.errorHandler.error('fileRequired'));
			}
			delete this.attributes.name;
			delete this.attributes.memberIds;
		}
		else if (this.attributes.type === 'direct') {
			delete this.attributes.file;
			delete this.attributes.repoId;
			delete this.attributes.name;
		}
		process.nextTick(callback);
	}

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

	checkExistingQuery () {
		let query = {
			teamId: this.attributes.teamId,
			type: this.attributes.type
		};
		let hint;
		if (this.attributes.type === 'channel') {
			query.name = this.attributes.name;
			hint = Indexes.byName;
		}
		else if (this.attributes.type === 'direct') {
			query.memberIds = this.attributes.memberIds;
			hint = Indexes.byMemberIds;
		}
		else if (this.attributes.type === 'file') {
			query.repoId = this.attributes.repoId;
			query.file = this.attributes.file;
			hint = Indexes.byFile;
		}
		return { query, hint };
	}

	modelCanExist () {
		return this.attributes.type !== 'channel';
	}

	preSave (callback) {
		this.attributes.creatorId = this.user.id;
		if (!this.existingModel) {
			this.attributes.nextSeqNum = 1;
		}
		BoundAsync.series(this, [
			this.createId,
			super.preSave
		], callback);
	}

	createId (callback) {
		this.attributes._id = this.attributes.sortId = this.data.streams.createId();
		callback();
	}

	postSave (callback) {
		this.grantUserMessagingPermissions(callback);
	}

	grantUserMessagingPermissions (callback) {
		if (!this.model.get('memberIds')) {
			return callback();	// no need to grant permissions for file-type stream, these get team-level messages
		}
		new StreamSubscriptionGranter({
			data: this.data,
			messager: this.api.services.messager,
			stream: this.model
		}).grantToMembers(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}

}

module.exports = StreamCreator;

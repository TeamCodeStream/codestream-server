// this class should be used to create all stream documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Stream = require('./stream');
//const StreamSubscriptionGranter = require('./stream_subscription_granter');
const StreamTypes = require('./stream_types');
const PrivacyTypes = require('./privacy_types');
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
	async createStream (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for stream creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['type']
			},
			optional: {
				boolean: ['isTeamStream'],
				number: ['accountId'],
				string: ['teamId', 'repoId', 'file', 'name', 'privacy', 'purpose', 'serviceType', 'serviceKey', 'objectId', 'objectType'],
				'array(string)': ['memberIds'],
				'object': ['serviceInfo']
			}
		};
	}

	// validate attributes for the stream we are creating
	async validateAttributes () {
		this.ensureUserIsMember();	// user must be a member of a direct or channel stream
		this.attributes.type = this.attributes.type.toLowerCase();	// enforce lower-case on the stream type
		if (!StreamTypes.includes(this.attributes.type)) {
			// only allow recognized stream types
			return this.errorHandler.error('invalidStreamType', { info: this.attributes.type });
		}
		if (this.attributes.type !== 'object' && !this.attributes.teamId) {
			// only object-type streams can go without a teamId
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		} else if (this.attributes.type === 'object') {
			// otherwise we need an account ID and object ID; the teamId gets built-in
			if (!this.attributes.accountId) {
				throw this.errorHandler.error('parameterRequired', { info: 'accountId' });
			}
			if (!this.attributes.objectId) {
				throw this.errorHandler.error('parameterRequired', { info: 'objectId' });
			}
			if (!this.attributes.objectType) {
				throw this.errorHandler.error('parameterRequired', { info: 'objectType' });
			}
		}

		if (this.attributes.isTeamStream) {
			// team-streams must be channels
			if (this.attributes.type !== 'channel') {
				return this.errorHandler.error('teamStreamMustBeChannel');
			}
			// team-streams are always public
			this.attributes.privacy = 'public';	
			// team-streams act like they have everyone in the team as members,
			// so we don't keep track of members at all
			delete this.attributes.memberIds;	
		}
		if (this.attributes.type === 'channel') {
			// channel streams must have a name
			if (!this.attributes.name) {
				return this.errorHandler.error('nameRequired');
			}
			// channels are private by default
			this.attributes.privacy = this.attributes.privacy || 'private';
			if (!PrivacyTypes.includes(this.attributes.privacy)) {
				return this.errorHandler.error('invalidPrivacyType', { info: this.attributes.privacy });
			}
			// channel streams ingore file and repo ID
			delete this.attributes.file;
			delete this.attributes.repoId;
		}
		else if (this.attributes.type === 'file') {
			// file-type streams must have a repo ID and file
			if (!this.attributes.repoId) {
				return this.errorHandler.error('repoIdRequired');
			}
			else if (!this.attributes.file) {
				return this.errorHandler.error('fileRequired');
			}
			// file streams are always public
			this.attributes.privacy = 'public';
			// file-type stream ignore name and members
			delete this.attributes.name;
			delete this.attributes.memberIds;
		}
		else if (this.attributes.type === 'direct') {
			// direct streams are always private
			this.attributes.privacy = 'private';
			// direct streams ignore file, repo ID, and name
			delete this.attributes.file;
			delete this.attributes.repoId;
			delete this.attributes.name;
		}
	}

	// ensure the user making the request is a member of channel or direct streams
	ensureUserIsMember () {
		if (this.attributes.type === 'file' || this.attributes.type === 'object') {
			return; // not required for files or object streams
		}
		if (this.attributes.isTeamStream) {
			return;	// a team-stream acts like a stream in which everyone is a member
		}
		this.attributes.memberIds = this.attributes.memberIds || [this.user.id];
		if (!(this.attributes.memberIds instanceof Array)) {
			// this will get caught later
			return;
		}
		if (!this.attributes.memberIds.includes(this.user.id)) {
			this.attributes.memberIds.push(this.user.id);
		}
		this.attributes.memberIds.sort();
	}

	// return database query to check if a matching stream already exists
	checkExistingQuery () {
		let query = {
			type: this.attributes.type
		};
		if (this.attributes.type !== 'object') {
			query.teamId = this.attributes.teamId;
		}

		let hint;
		if (this.attributes.type === 'channel') {
			// channel streams match by name
			query.name = this.attributes.name;
			hint = Indexes.byName;
		} else if (this.attributes.type === 'direct') {
			// direct stream match by membership
			query.memberIds = this.attributes.memberIds;
			hint = Indexes.byMembers;
		} else if (this.attributes.type === 'file') {
			// file stream match by repo and file
			query.repoId = this.attributes.repoId;
			query.file = this.attributes.file;
			hint = Indexes.byFile;
		} else if (this.attributes.type === 'object') {
			// object streams match by object ID
			query.objectId = this.attributes.objectId;
			query.objectType = this.attributes.objectType;
			hint = Indexes.byObjectId;
		}
		return { query, hint };
	}

	// return whether a matching stream can exist or if an error should be returned
	modelCanExist () {
		// matching file-type streams and direct streams are permitted, but not channel streams
		// (also object streams)
		return this.attributes.type !== 'channel';
	}

	// called before the stream is actually saved
	async preSave () {
		// if owned by a team connected to a third-party provider, check validation rules
		// for the provider
		await this.checkNameForProvider();
			
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
		this.createId();
		this.attributes.sortId = this.attributes.id;
		await super.preSave();
	}

	// if the name of a channel is being changed, and the team that owns the stream is
	// connected to a third-party provider, check that the name of the channel is valid
	// for the provider
	async checkNameForProvider () {
		if (this.attributes.type !== 'channel') {
			return; 
		}
		this.team = await this.request.data.teams.getById(this.attributes.teamId);
		if (!this.team) { return; }
		const providerInfo = this.team.get('providerInfo') || {};
		Object.keys(providerInfo).forEach(provider => {
			let error;
			switch (provider) {
			case 'slack': 
				error = this.request.api.services.slackAuth.validateChannelName(this.attributes.name);
			}

			if (error) {
				throw this.errorHandler.error('validation', { info: { name: error } });
			}
		});
	}

	/*
	// after the stream has been saved
	async postSave () {
		// grant permission to the members of the stream to subscribe to the stream's broadcaster channel
		await this.grantUserMessagingPermissions();
	}

	// grant permission to the members of the stream to subscribe to the stream's broadcaster channel
	async grantUserMessagingPermissions () {
		if (!this.model.get('memberIds') || this.model.get('isTeamStream')) {
			// no need to grant permissions for file-type stream, or for team-streams,
			// these always get team-level messages
			return;	
		}
		try {
			await new StreamSubscriptionGranter({
				data: this.data,
				broadcaster: this.api.services.broadcaster,
				stream: this.model,
				request: this.request
			}).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('streamMessagingGrant', { reason: error });
		}
	}
	*/
}

module.exports = StreamCreator;

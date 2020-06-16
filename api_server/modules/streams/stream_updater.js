// this class should be used to update stream documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Stream = require('./stream');
const Indexes = require('./indexes');
const Errors = require('./errors');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class StreamUpdater extends ModelUpdater {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	get modelClass () {
		return Stream;	// class to use to create a stream model
	}

	get collectionName () {
		return 'streams';	// data collection to use
	}

	// convenience wrapper
	async updateStream (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['name', 'purpose'],
			object: ['$addToSet', '$push', '$pull'],
			boolean: ['isArchived']
		};
	}

	// validate the input attributes
	validateAttributes () {
		// we restrict only to $addToSet.memberIds and $pull.memberIds
		for (let attribute of ['$addToSet', '$push', '$pull']) {
			if (this.attributes[attribute]) {
				const value = this.attributes[attribute];
				delete this.attributes[attribute];
				if (value.memberIds) {
					if (typeof value.memberIds === 'string') {
						value.memberIds = [value.memberIds];
					}
					else if (!(value.memberIds instanceof Array)) {
						return 'memberIds must be array';
					}
					this.attributes[attribute] = { memberIds: value.memberIds };
				}
			}
		}
		if (this.attributes.$push) {
			// $push is made equivalent to $addToSet
			this.attributes.$addToSet = this.attributes.$addToSet || {};
			this.attributes.$addToSet.memberIds = ((this.attributes.$addToSet || {}).memberIds || []).concat(this.attributes.$push.memberIds);
			delete this.attributes.$push;
		}
		if (this.attributes.$addToSet && this.attributes.$pull) {
			return 'can not $addToSet and $pull memberIds at the same time';
		}

		// specifically mark whether a stream will be archived
		if (this.attributes.isArchived) {
			this.wasArchived = true;
		}
	}

	// before the user info gets saved...
	async preSave () {
		await this.getStream();
		await this.getTeam();
		await this.checkNameUnique();
		await this.checkNameForProvider();
		await this.getUsers();
		await this.clearUnreads();
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}

	// get the stream needed for update
	async getStream () {
		this.stream = await this.request.data.streams.getById(this.id);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
	}

	// get the team that owns the stream
	async getTeam () {
		this.team = await this.request.data.teams.getById(this.stream.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' }); // shouldn't happen, of course
		}
	}

	// if changing the name of the stream, make sure the name will be unique
	async checkNameUnique () {
		if (!this.attributes.name) {
			return;
		}
		const matchingStreams = await this.data.streams.getByQuery(
			{
				teamId: this.stream.get('teamId'),
				name: this.attributes.name
			},
			{
				hint: Indexes.byName,
				fields: ['id', 'name'],
				noCache: true
			}
		);
		if (matchingStreams.find(stream => stream.id !== this.stream.id)) {
			throw this.errorHandler.error('duplicateName');
		}
	}

	// if the name of a channel is being changed, and the team that owns the stream is
	// connected to a third-party provider, check that the name of the channel is valid
	// for the provider
	async checkNameForProvider () {
		if (this.stream.get('type') !== 'channel' || !this.attributes.name) {
			return; 
		}
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

	// confirm that the IDs for the users being added or removed are valid
	async getUsers () {
		let memberIds = 
		(
			this.attributes.$addToSet && 
			this.attributes.$addToSet.memberIds
		) || 
		(
			this.attributes.$pull &&
			this.attributes.$pull.memberIds
		) ||
		[];
		if (memberIds.length === 0) {
			return;
		}
        
		// can't change the membership of team-streams
		if (this.stream.get('isTeamStream')) {
			throw this.errorHandler.error('updateAuth', { reason: 'can not change membership of a team stream' });
		} 
		
		// all users must actually exist
		const users = await this.request.data.users.getByIds(memberIds);
		const foundMemberIds = users.map(user => user.id);
		const notFoundMemberIds = ArrayUtilities.difference(memberIds, foundMemberIds);
		if (notFoundMemberIds.length > 0) {
			throw this.errorHandler.error('notFound', { info: 'one or more users' });
		}

		// all users must be a member of the team that owns the stream
		if (users.find(user => !user.hasTeam(this.stream.get('teamId')))) {
			throw this.errorHandler.error('updateAuth', { reason: 'one or more users are not a member of the team that owns the stream' });
		}

		// only add or remove genuine members
		if (this.attributes.$addToSet) {
			this.attributes.$addToSet.memberIds = memberIds;
			this.transforms.addedUsers = users;
		}
		else if (this.attributes.$pull) {
			this.attributes.$pull.memberIds = memberIds;
			this.transforms.removedUsers = users;
		}
	}

	// clear the unreads for all relevant users - users removed from the stream, or if the stream
	// was archived, all users in the stream
	async clearUnreads () {
		if (this.wasArchived) {
			// the stream was archived, remove lastUnreads for all users in the stream
			await this.clearUnreadsForAllUsers();
		}
		else if (this.transforms.removedUsers && this.transforms.removedUsers.length > 0) {
			// certain users were removed, remove lastUnreads for those users only
			const userIds = this.transforms.removedUsers.map(user => user.id);
			await this.clearUnreadsForUsers(userIds);
		}
	}
	
	// clear the unreads for all users in the stream, since it was archived
	async clearUnreadsForAllUsers () {
		let memberIds;
		if (this.stream.get('isTeamStream')) {
			memberIds = this.team.get('memberIds') || [];
		}
		else {
			memberIds = this.stream.get('memberIds') || [];
		}
		await this.clearUnreadsForUsers(memberIds);
	}

	// clear the unreads for the given users
	async clearUnreadsForUsers (userIds) {
		this.transforms.userUpdateOps = [];
		// update the lastReads for all users, or as given by the query
		await Promise.all(userIds.map(async userId => {
			await this.clearUnreadsForUser(userId);
		}));
	}

	// clear the unreads for the given user
	async clearUnreadsForUser (userId) {
		const op = {
			$unset: {
				[`lastReads.${this.stream.id}`]: true
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		
		const updateOp = await new ModelSaver({
			request: this.request,
			collection: this.request.data.users,
			id: userId
		}).save(op);
		this.transforms.userUpdateOps.push(updateOp);
	}
}

module.exports = StreamUpdater;

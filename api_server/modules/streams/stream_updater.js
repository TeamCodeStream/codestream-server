// this class should be used to update stream documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Stream = require('./stream');

class StreamUpdater extends ModelUpdater {

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
	}

	// before the user info gets saved...
	async preSave () {
		await this.getStream();
		await this.getUsers();
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}

	// get the user needed for save
	async getStream () {
		this.stream = await this.request.data.streams.getById(this.id);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
	}

	// confirm that the IDs for the users being added or removed are valid
	async getUsers () {
		let memberIds = (
			this.attributes.$addToSet && 
			this.attributes.$addToSet.memberIds
		) || (
				this.attributes.$pull &&
			this.attributes.$pull.memberIds
			) || [];
		if (memberIds.length === 0) {
			return;
		}
		const users = await this.request.data.users.getByIds(memberIds);
		memberIds = users.map(user => user.id);
        
		// can't change the membership of team-streams
		if (this.stream.get('isTeamStream') && memberIds.length > 0) {
			throw this.errorHandler.error('updateAuth', { reason: 'can not change membership of a team stream' });
		} 
        
		// only add or remove genuine members
		if (this.attributes.$addToSet) {
			this.attributes.$addToSet.memberIds = memberIds;
			this.addedUsers = users;
		}
		else if (this.attributes.$pull) {
			this.attributes.$pull.memberIds = memberIds;
			this.removedUsers = users;
		}
	}
}

module.exports = StreamUpdater;

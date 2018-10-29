// this class should be used to update item documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Item = require('./item');

class ItemUpdater extends ModelUpdater {

	get modelClass () {
		return Item;	// class to use to create a item model
	}

	get collectionName () {
		return 'items';	// data collection to use
	}

	// convenience wrapper
	async updateItem (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['postId', 'streamId']
		};
	}

	// called before the item is actually saved
	async preSave () {
		await this.getItem();		// get the item
		if (this.attributes.postId) {
			// if providing post ID, we assume it is a pre-created item for third-party
			// integration, which requires special treatment
			await this.validatePostId();
		}
		await super.preSave();		// base-class preSave
	}

	// get the item
	async getItem () {
		this.item = await this.request.data.items.getById(this.attributes._id);
		if (!this.item) {
			throw this.errorHandler.error('notFound', { info: 'item' });
		}
	}

	// validate the operation
	async validatePostId () {
		if (this.item.get('postId')) {
			throw this.errorHandler.error('validation', { info: 'item already has a post ID' });
		}
		if (!this.item.get('providerType')) {
			throw this.errorHandler.error('validation', { info: 'can not set postId if item is has no providerType' });
		}
		if (!this.attributes.streamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		this.attributes.providerType = this.item.get('providerType');
	}
}

module.exports = ItemUpdater;

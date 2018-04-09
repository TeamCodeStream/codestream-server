// provides an abstract base class to handle the deletion (really deactivation) of a document
// in the database...  a standard flow of operations is provided here, but heavy derivation
// can be done to tweak this process

'use strict';

const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class ModelDeleter {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.attachToResponse = {};	// additional material we want to get returned to the client
	}

	// delete the model
	async deleteModel (id) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			throw this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` });
		}
		this.setAttributesForDelete(id);
		await this.preDelete();	// prepare to delete the document
		await this.delete();	// delete the document
		await this.postDelete();// give the derived class a chance to do stuff after we've deleted
		return this.update;
	}

	// set the actual attributes indicating a model has been deleted ...
	// override this for custom handling
	setAttributesForDelete (id) {
		this.attributes = {
			[this.collection.idAttribute]: id,
			deactivated: true
		};
	}

	// called right before we delete
	async preDelete () {
		// create a model from the attributes and let it do its own pre-save, this is where
		// validation happens ... note that since we're doing a deactivation, we do not have
		// a complete model here
		this.model = new this.modelClass(this.attributes, { dontSetDefaults: true });
		let errors = await this.model.preSave();
		if (!errors) {
			return;
		}
		if (!(errors instanceof Array)) {
			errors = [errors];
		}
		throw this.errorHandler.error('validation', { info: errors });
	}


	// do the actual deletion
	async delete () {
		// set the deactivated flag
		this.update = DeepClone(this.model.attributes);
		this.model = await this.collection.update(this.model.attributes);
		this.update = this.model.validator.sanitizeAttributes(this.update);
	}

	// override to do stuff after the document has been deleted
	async postDelete () {
	}
}

module.exports = ModelDeleter;

// provides an abstract base class to handle the deletion (really deactivation) of a document
// in the database...  a standard flow of operations is provided here, but heavy derivation
// can be done to tweak this process

'use strict';

const ModelSaver = require('./model_saver');

class ModelDeleter {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user', 'transforms'].forEach(x => this[x] = this.request[x]);
	}

	// delete the model
	async deleteModel (id) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			throw this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` });
		}
		this.id = id;
		this.setOpForDelete();
		await this.preDelete();	// prepare to delete the document
		await this.delete();	// delete the document
		await this.postDelete();// give the derived class a chance to do stuff after we've deleted
		return this.updateOp;
	}

	// set the actual op to execute to delete an op ...
	// override this for custom handling
	setOpForDelete () {
		this.deleteOp = {
			$set: {
				deactivated: true
			}
		};
	}

	// called right before we delete, override
	async preDelete () {
	}

	// do the actual deletion
	async delete () {
		// execute the deletion op
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.collection,
			id: this.id
		}).save(this.deleteOp);
	}

	// override to do stuff after the document has been deleted
	async postDelete () {
	}
}

module.exports = ModelDeleter;

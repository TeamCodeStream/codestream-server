// provides an abstract base class to handle the deletion (really deactivation) of a document 
// in the database...  a standard flow of operations is provided here, but heavy derivation 
// can be done to tweak this process

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class ModelDeleter {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user'].forEach(x => this[x] = this.request[x]);
		this.attachToResponse = {};	// additional material we want to get returned to the client
	}

	// delete the model
	deleteModel (id, callback) {
		this.collection = this.data[this.collectionName];
		if (!this.collection) {
			return callback(this.errorHandler.error('internal', { reason: `collection ${this.collectionName} is not a valid collection` }));
		}

		this.attributes = {
			[this.collection.idAttribute]: id,
			deactivated: true 
		};
		BoundAsync.series(this, [
			this.preDelete,				// prepare to delete the document
			this.delete,				// delete the document
			this.postDelete				// give the derived class a chance to do stuff after we've deleted
		], (error) => {
	 		callback(error, this.update);
		});
	}

	// called right before we delete
	preDelete (callback) {
		// create a model from the attributes and let it do its own pre-save, this is where
		// validation happens ... note that since we're doing a deactivation, we do not have
		// a complete model here
		this.model = new this.modelClass(this.attributes, { dontSetDefaults: true });
		this.model.preSave(
			(errors) => {
				if (errors) {
					if (!(errors instanceof Array)) {
						errors = [errors];
					}
					return callback(this.errorHandler.error('validation', { info: errors }));
				}
				else {
					return process.nextTick(callback);
				}
			}
		);
	}


	// do the actual deletion
	delete (callback) {
		// set the deactivated flag
		this.update = DeepClone(this.model.attributes);
		this.collection.update(
			this.model.attributes,
			(error, updatedModel) => {
				if (error) { return callback(error); }
				this.model = updatedModel;
				this.update = this.model.validator.sanitizeAttributes(this.update);
				process.nextTick(callback);
			}
		);
	}

	// override to do stuff after the document has been deleted
	postDelete (callback) {
		process.nextTick(callback);
	}
}

module.exports = ModelDeleter;

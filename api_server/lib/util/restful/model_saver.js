'use strict';

const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class ModelSaver {

	constructor (options) {
		Object.assign(this, options);
		['collection', 'id', 'request'].forEach(prop => {
			if (!this[prop]) {
				throw `ModelSaver must have ${prop}`;
			}
		});
	}
	
	async save (attributes) {
		this.attributes = attributes || {};
		await this.getModelVersion();
		await this.extractOps();
		await this.validate();
		await this.update();
		return this.updateOp;

	}
	// get the model to update
	async getModelVersion () {
		const model = await this.collection.getById(
			this.id, 
			{
				noCache: true,
				fields: ['version'] 
			}
		);
		if (!model) {
			throw this.request.errorHandler.error('notFound');
		}
		this.modelVersion = model.get('version') || 1;
	}

	// extract any op-directives from the attributes, these are treated separately
	async extractOps () {
		const opKeys = Object.keys(this.attributes).filter(opKey => opKey.startsWith('$'));
		if (opKeys.length === 0) {
			return;
		}
		this.ops = { };
		Object.keys(this.attributes).forEach(attribute => {
			if (attribute.startsWith('$')) {
				this.ops[attribute] = Object.assign(this.ops[attribute] || {}, this.attributes[attribute]);
				delete this.attributes[attribute];
			}
			else if (attribute !== 'id') {
				this.ops.$set = this.ops.$set || {};
				if (typeof this.attributes[attribute] === 'object') {
					this.ops.$set[attribute] = DeepClone(this.attributes[attribute]);
				}
				else {
					this.ops.$set[attribute] = this.attributes[attribute];
				}
			}
		});
	}

	// validate the model according to the expected update
	async validate () {
		// create a model from the attributes and let it do its own pre-save, this is where
		// validation happens ... note that since we're doing an update, we might not have
		// (and actually probably don't) have a complete model here
		this.tempModel = new this.collection.modelClass(this.attributes, { dontSetDefaults: true });
		try {
			await this.tempModel.preSave();
		}
		catch (error) {
			throw this.request.errorHandler.error('validation', { info: error });
		}
		if (this.tempModel.validationWarnings instanceof Array) {
			this.request.warn(`Validation warnings: \n${this.tempModel.validationWarnings.join('\n')}`);
		}
		Object.assign(this.attributes, this.tempModel.attributes);
	}

	// do the actual update
	async update () {
		// do the update
		if (!this.ops) {
			this.ops = {
				$set: this.attributes
			};
			delete this.ops.$set.id;
		}
		this.updateOp = await this.collection.applyOpById(
			this.id,
			this.ops,
			{ version: this.modelVersion }
		);
	}
}

module.exports = ModelSaver;

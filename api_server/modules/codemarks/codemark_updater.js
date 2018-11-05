// this class should be used to update codemark documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Codemark = require('./codemark');

class CodemarkUpdater extends ModelUpdater {

	get modelClass () {
		return Codemark;	// class to use to create a codemark model
	}

	get collectionName () {
		return 'codemarks';	// data collection to use
	}

	// convenience wrapper
	async updateCodemark (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['postId', 'streamId']
		};
	}

	// called before the codemark is actually saved
	async preSave () {
		await this.getCodemark();		// get the codemark
		if (this.attributes.postId) {
			// if providing post ID, we assume it is a pre-created codemark for third-party
			// integration, which requires special treatment
			await this.validatePostId();
		}
		await super.preSave();		// base-class preSave
	}

	// get the codemark
	async getCodemark () {
		this.codemark = await this.request.data.codemarks.getById(this.attributes._id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
	}

	// validate the operation
	async validatePostId () {
		if (this.codemark.get('postId')) {
			throw this.errorHandler.error('validation', { info: 'codemark already has a post ID' });
		}
		if (!this.codemark.get('providerType')) {
			throw this.errorHandler.error('validation', { info: 'can not set postId if codemark is has no providerType' });
		}
		if (!this.attributes.streamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		this.attributes.providerType = this.codemark.get('providerType');
	}
}

module.exports = CodemarkUpdater;

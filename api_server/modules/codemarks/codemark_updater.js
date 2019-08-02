// this class should be used to update codemark documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Codemark = require('./codemark');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const CodemarkHelper = require('./codemark_helper');

class CodemarkUpdater extends ModelUpdater {

	constructor (options) {
		super(options);
		this.codemarkHelper = new CodemarkHelper({ request: this });
	}

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
			string: ['postId', 'streamId', 'parentPostId', 'status', 'text', 'title', 'color'],
			'array(string)': ['assignees', 'tags', 'relatedCodemarkIds']
		};
	}

	// called before the codemark is actually saved
	async preSave () {
		// get the codemark
		await this.getCodemark();	
		
		// get the codemark's team
		await this.getTeam();	

		// if providing post ID, we assume it is a pre-created codemark for third-party
		// integration, which requires special treatment
		if (this.attributes.postId || this.attributes.streamId) {
			await this.validatePostId();
			await this.updateMarkers();
		}

		// can only update parentPostId for third-party
		if (this.attributes.parentPostId && !this.codemark.get('providerType')) {
			delete this.attributes.parentPostId;
		}

		// pre-validate the incoming attributes before saving
		await this.preValidate();

		// validate any provided tags
		await this.codemarkHelper.validateTags(this.attributes.tags, this.team);

		// link or unlink related codemarks to this one
		await this.codemarkHelper.changeCodemarkRelations(this.codemark.attributes, this.attributes, this.team.id);

		// validate any assignees, for issues
		await this.codemarkHelper.validateAssignees(this.codemark.attributes, this.attributes);

		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}

	// get the codemark
	async getCodemark () {
		this.codemark = await this.request.data.codemarks.getById(this.attributes.id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
	}

	// get the codemark's team
	async getTeam () {
		this.team = await this.request.data.teams.getById(this.codemark.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
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
		if (!this.attributes.streamId || !this.attributes.postId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId and postId' });
		}
	}

	// if postID and stream ID are being set, set them on any referenced markers as well
	async updateMarkers () {
		if (!this.codemark.get('markerIds')) {
			return;
		}
		this.transforms.markerUpdates = [];
		this.markers = await this.request.data.markers.getByIds(this.codemark.get('markerIds'));
		await Promise.all(this.markers.map(async marker => {
			await this.updateMarker(marker);
		}));
	}

	// update a marker with post ID and stream ID
	async updateMarker (marker) {
		const op = {
			$set: {
				postStreamId: this.attributes.streamId,
				postId: this.attributes.postId,
				modifiedAt: Date.now()
			}
		};
		const markerUpdate = await new ModelSaver({
			request: this.request,
			collection: this.request.data.markers,
			id: marker.id
		}).save(op);
		this.transforms.markerUpdates.push(markerUpdate);
	}

	// pre-validate the incoming attributes before saving
	async preValidate () {
		// since validation is dependent on the type of codemark, we can't let the
		// generic ModelUpdater do the full validation, so create a temporary model
		// and run the validation against that
		const tempAttributes = DeepClone(this.codemark.attributes);
		Object.assign(tempAttributes, this.attributes);
		const tempModel = new Codemark(tempAttributes);
		try {
			await tempModel.preSave();
		}
		catch (error) {
			throw this.request.errorHandler.error('validation', { info: error });
		}
	}
}

module.exports = CodemarkUpdater;

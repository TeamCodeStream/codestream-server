// this class should be used to update marker documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Marker = require('./marker');

class MarkerUpdater extends ModelUpdater {

	get modelClass () {
		return Marker;	// class to use to create a marker model
	}

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	async updateMarker (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['commitHashWhenCreated']
		};
	}

	async preSave () {
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}
}

module.exports = MarkerUpdater;

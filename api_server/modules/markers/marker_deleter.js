// this class should be used to update post documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
const Marker = require('./marker');

class MarkerDeleter extends ModelDeleter {

	get modelClass () {
		return Marker;    // class to use to create a post model
	}

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	async deleteMarker (id) {
		return await this.deleteModel(id);
	}
}

module.exports = MarkerDeleter;

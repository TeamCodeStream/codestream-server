// this class should be used to update post documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');

class MarkerDeleter extends ModelDeleter {

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	async deleteMarker (id) {
		return await this.deleteModel(id);
	}

	// set the actual op to execute to delete an op 
	setOpForDelete () {
		super.setOpForDelete();
		this.deleteOp.$set.modifiedAt = Date.now();
	}
}

module.exports = MarkerDeleter;

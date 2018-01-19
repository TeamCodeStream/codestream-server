// this class should be used to update post documents in the database

'use strict';

var ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
var Marker = require('./marker');

class MarkerDeleter extends ModelDeleter {

    get modelClass () {
        return Marker;    // class to use to create a post model
    }

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	deleteMarker (id, callback) {
		return this.deleteModel(id, callback);
	}
}

module.exports = MarkerDeleter;

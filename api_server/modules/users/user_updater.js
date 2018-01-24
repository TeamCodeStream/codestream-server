// this class should be used to update user documents in the database

'use strict';

var ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
var User = require('./user');

class UserUpdater extends ModelUpdater {

	get modelClass () {
		return User;	// class to use to create a user model
	}

	get collectionName () {
		return 'users';	// data collection to use
	}

	// convenience wrapper
	updateUser (id, attributes, callback) {
		return this.updateModel(id, attributes, callback);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
            string: ['username', 'firstName', 'lastName']
		};
	}

    // after the post has been saved...
    postSave (callback) {
        // this.update is what we return to the client, since the modifiedAt
        // has changed, add that
        this.update.modifiedAt = this.model.get('modifiedAt');
        callback();
    }
}

module.exports = UserUpdater;

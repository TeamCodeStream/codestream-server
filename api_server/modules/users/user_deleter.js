// this class should be used to delete user documents in the database

'use strict';

const ModelDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_deleter');

class UserDeleter extends ModelDeleter {

	get collectionName () {
		return 'users';	// data collection to use
	}

	// convenience wrapper
	async deleteUser (id) {
		return await this.deleteModel(id);
	}

	// set the actual op to execute to delete an op 
	async setOpForDelete () {
		// get the user to delete
		this.userToDelete = await this.data.users.getById(this.id);
		if (!this.userToDelete) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}

		// check if already deleted
		if (this.userToDelete.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}

		// change the user's email to indicate this is a deactivated user
		super.setOpForDelete();
		const email = this.userToDelete.get('email');
		const emailParts = email.split('@');
		const now = Date.now();
		const deactivatedEmail = `${emailParts[0]}-deactivated${now}@${emailParts[1]}`;		
		this.deleteOp.$set.email = deactivatedEmail;
		this.deleteOp.$set.searchableEmail = deactivatedEmail.toLowerCase();
		this.deleteOp.$set.modifiedAt = Date.now();
		if (this.userToDelete.get('encryptedPasswordTemp')) {
			this.deleteOp.$unset = {
				encryptedPasswordTemp: true
			};
		}
	}
}

module.exports = UserDeleter;

// this class should be used to create all changeset documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Changeset = require('./changeset');

class ChangesetCreator extends ModelCreator {

	get modelClass () {
		return Changeset;	// class to use to create a changeset model
	}

	get collectionName () {
		return 'changesets';	// data collection to use
	}

	// convenience wrapper
	async createChangeset (attributes) {
		return await this.createModel(attributes);
	}

	// right before the document is saved...
	async preSave () {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.attributes.reviewId = this.reviewId;
		this.attributes.creatorId = this.request.user.id;
		await super.preSave();	// proceed with the save...
	}
}

module.exports = ChangesetCreator;

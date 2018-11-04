'use strict';

const UpdatedSetRepoMessageTest = require('./updated_set_repo_message_test');

class UpdatedMatchedRepoMessageTest extends UpdatedSetRepoMessageTest {

	get description () {
		return 'members of the team should receive a message with a repo update when a post and item are posted with a marker and remotes are specified that match known remotes for the repo but there are new remotes as well';
	}

	makePostData (callback) {
		super.makePostData(() => {
			// use remote from existing repo but also a new remote, this should get added to the existing repo
			const marker = this.data.item.markers[0];
			delete marker.repoId;
			marker.remotes.push(this.repo.remotes[0].url);
			callback();
		});
	}
}

module.exports = UpdatedMatchedRepoMessageTest;

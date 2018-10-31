'use strict';

const UpdateMatchedRepoWithRemotesTest = require('./update_matched_repo_with_remotes_test');

class UpdateSetRepoWithRemotesTest extends UpdateMatchedRepoWithRemotesTest {

	get description () {
		return 'when a marker has a stream to be created on the fly and specifies remotes that are not known for the repo, those new remotes should be added to the known remotes for the repo';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		// the repo ID is not added to the marker when remotes are provided,
		// we'll override that by adding the repo ID back, forcing the server to identify
		// the repo without looking at the remotes ... however, the remotes should still
		// be added to the repo
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.markers[0].repoId = this.repo._id;
			callback();
		});
	}
}

module.exports = UpdateSetRepoWithRemotesTest;

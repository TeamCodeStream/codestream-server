'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class CodemarkWithReferenceLocationsTest extends CodemarkMarkerTest {

	get description () {
		return 'should return a valid post and codemark when creating a post with a codemark with additional reference locations provided';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// add reference locations to the codemark marker
		super.makePostData(() => {
			this.data.codemark.markers[0].referenceLocations = [
				{
					commitHash: this.repoFactory.randomCommitHash(),
					location: this.markerFactory.randomLocation(),
					branch: this.markerFactory.randomBranch(),
					flags: {
						elem1: true,
						elem2: 'hello'
					}
				},
				{
					commitHash: this.repoFactory.randomCommitHash(),
					location: this.markerFactory.randomLocation(),
					branch: this.markerFactory.randomBranch(),
					flags: {
						elem3: 1,
						elem4: {
							this: 1,
							that: 'blah'
						}
					}
				}
			];
			callback();
		});
	}
}

module.exports = CodemarkWithReferenceLocationsTest;

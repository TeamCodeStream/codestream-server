'use strict';

const MarkerTest = require('./marker_test');

class ReferenceLocationsTest extends MarkerTest {

	get description () {
		return 'should return a valid codemark when creating a codemark with additional reference locations provided';
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// add reference locations to the codemark marker
		super.makeCodemarkData(() => {
			this.data.markers[0].referenceLocations = [
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

module.exports = ReferenceLocationsTest;

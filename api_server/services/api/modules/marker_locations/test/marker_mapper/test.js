'use strict';

var NodeGit = require('nodegit');
var GitRepo = require(process.env.CS_API_TOP + '/lib/util/git_repo/git_repo');
var MarkerMapper = require('../../marker_mapper');
var Assert = require('assert');
const TEST_REPO_PATH = process.env.CS_API_TEST_REPO_PATH;

// make jshint happy
/* globals describe, before, it */

const emptyArray = [];

function concatArrays(...arrays) {
	return emptyArray.concat.apply(emptyArray, arrays);
}

describe('MarkerMapper', () => {
	const _ = -1;

	//const commit1 = '5c255290f37247acb227d9d9e9595d32ef3eb786';
	const commit2 = 'dfa7aeb2db7f5981a07c43f723d5e9df4724429c';
	//const commit3 = '1f2a13b7597f67f02ccf4089581f3d956dfea308';
	//const commit4 = '7d312dc8cb00194b0506077f3db0e1c9ad4ced2e';
	//const commit5 = '6aad7d350476b703a8cb616119fbc100476da25b';
	const commit6 = '7c1e4d89c8d0fea47a9eafbdb80d64d1823a5676';
	const commit7 = '5ea06042f2d8a85559d512bb66f3ced96f35cd2c';
	const commit8 = '36d3853d08eb8213f6c6b966b547e1dc6071ef8b';
	const commit9 = '5ee40509569188da0b7012ef586ff85b8b5d1543';

	var git, repo;

	before (callback => {
		NodeGit.Repository.open(TEST_REPO_PATH)
			.then(_git => {
				git = _git;
				repo = new GitRepo(git);
				callback();
			})
			.catch(callback);
	});

	function getDeltas (hash, callback) {
		git.setHeadDetached(hash);
		repo.getCurrentCommit((error, commit) => {
			if (error) { return callback(error); }
			repo.getDeltas(commit, callback);
		});
	}

	function buildSingleLineMarkers(totalLines) {
		let line = 1;
		let markerLocations = {};
		while (line <= totalLines) {
			markerLocations[line] = [ line, 1, line, 100 ];
			line++;
		}
		return markerLocations;
	}

	function expectMarkers(markerLocations, expectedLines) {
		for (let i = 0; i < Object.keys(markerLocations).length; i++) {
			let actual = markerLocations[i+1][0];
			let expected = expectedLines[i];
			Assert.equal(expected, actual, `marker ${i+1} should be at ${expected}`);
		}
	}

	function expectLocation(location, lineStart, colStart, lineEnd, colEnd) {
		Assert.equal(lineStart, location[0], `lineStart should be ${lineStart}`);
		Assert.equal(colStart, location[1], `colStart should be ${colStart}`);
		Assert.equal(lineEnd, location[2], `lineEnd should be ${lineEnd}`);
		Assert.equal(colEnd, location[3], `colEnd should be ${colEnd}`);
	}

	describe('getUpdatedMarkerData()', () => {
		describe('when markers are single-line', () => {

			it('recalculates positions for commit #2', callback => {
				const markerLocations = buildSingleLineMarkers(7);
				getDeltas(commit2, (error, deltas) => {
					let markerMapper = new MarkerMapper(markerLocations, deltas[0].edits);
					markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
						const expected = [_, 4, 5, 10, 11, 12, 19];
						expectMarkers(updatedMarkerLocations, expected);
						callback();
					});
				});
			});

			it('recalculates positions for commit #6', callback => {
				const markerLocationsFile1 = buildSingleLineMarkers(18);
				const markerLocationsFile3 = buildSingleLineMarkers(15);
				getDeltas(commit6, (error, deltas) => {
					const deltaFile1 = deltas[0];
					const deltaFile3 = deltas[1];
					let markerMapper = new MarkerMapper(markerLocationsFile1, deltaFile1.edits);
					markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
						const expectedFile1 = concatArrays(
							[1, 2, 4, 5, 6, 7, 8],
							[10, 11, 12, 13, 14],
							[20, 21, 22, 23, 24, 25]
						);
						expectMarkers(updatedMarkerLocations, expectedFile1);
						let markerMapper = new MarkerMapper(markerLocationsFile3, deltaFile3.edits);
						markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
							const expectedFile3 = [1, 2, 3, 4, 5, 6, 7, 8, _, _, _, _, 9, 10, 11];
							expectMarkers(updatedMarkerLocations, expectedFile3);
							callback();
						});
					});
				});
			});

			it('recalculates positions for commit #7', callback => {
				const markerLocationsFile1 = buildSingleLineMarkers(27);
				getDeltas(commit7, (error, deltas) => {
					const deltaFile1 = deltas[0];
					let markerMapper = new MarkerMapper(markerLocationsFile1, deltaFile1.edits);
					markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
						const expectedFile1 = concatArrays(
							[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
							[11, 12, 13, 14, 15, 16, _, 20],
							[21, 22, 23, 24, 25, 26, 27, 28, 29]
						);
						expectMarkers(updatedMarkerLocations, expectedFile1);
						callback();
					});
				});
			});

		});

		describe('when markers are multi-line', () => {

			it('recalculates positions when lines are modified within the marker range ', callback => {
				getDeltas(commit8, (error, deltas) => {
					const markerLocations = {
						'1': [ 15, 1, 20, 100 ]
					};
					let markerMapper = new MarkerMapper(markerLocations, deltas[0].edits);
					markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
						expectLocation(updatedMarkerLocations['1'], 15, 1, 31, 100);
						callback();
					});
				});
			});

			it('recalculates position when a function moved down', callback => {
				getDeltas(commit9, (error, deltas) => {
					const method1 = {
						'1': [ 5, 1, 7, 100 ]
					};
					let markerMapper = new MarkerMapper(method1, deltas[0].edits);
					markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
						expectLocation(updatedMarkerLocations['1'], 9, 1, 11, 100);
						callback();
					});
				});
			});

		});

		describe('when markers have column information', () => {

			it('recalculates positions when lines are modified within the marker range ', callback => {
				getDeltas(commit7, (error, deltas) => {
					// function *useSunscreen()* {
					const useSunscreenFnOld = [ 15, 10, 15, 23 ];
					// var sunscreen = *new Sunscreen();*
					const newSunscreenOld = [ 16, 21, 16, 36 ];
					const markerLocations = {
						'1': useSunscreenFnOld,
						'2': newSunscreenOld
					};
					let markerMapper = new MarkerMapper(markerLocations, deltas[0].edits);
					markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
						// function *useSunscreenRenamed()* {
						const useSunscreenFnNew = updatedMarkerLocations['1'];
						expectLocation(useSunscreenFnNew, 15, 10, 15, 30);
						// var ss = *new Sunscreen();*
						const newSunscreenNew = updatedMarkerLocations['2'];
						expectLocation(newSunscreenNew, 16, 14, 16, 29);
						callback();
					});
				});
			});

			it('recalculates positions when a function is moved down', callback => {
				getDeltas(commit9, (error, deltas) => {
					const method1NameOnly = [ 5, 5, 5, 13 ];
					const method1Whole = [ 5, 5, 7, 5 ];
					const markerLocations = {
						'1': method1NameOnly,
						'2': method1Whole
					};
					let markerMapper = new MarkerMapper(markerLocations, deltas[0].edits);
					markerMapper.getUpdatedMarkerData((error, updatedMarkerLocations) => {
						const method1NameOnlyMoved = updatedMarkerLocations['1'];
						const method1WholeMoved = updatedMarkerLocations['2'];
						expectLocation(method1NameOnlyMoved, 9, 5, 9, 13);
						expectLocation(method1WholeMoved, 9, 5, 11, 5);
						callback();
					});
				});
			});

		});
	});
});

#!/usr/bin/env node

//desc mongo utility script to remove test data

// mongo script to remove all data created by API server unit tests,
// which put a special flag into all data created called _forTesting

// make jshint happy
/* globals db */

const Collections = [
	'companies',
	'teams',
	'repos',
	'streams',
	'posts',
	'markers',
	'markerLocations',
	'users'
];

for (let collection of Collections) {
	db[collection].remove({_forTesting: true});
}

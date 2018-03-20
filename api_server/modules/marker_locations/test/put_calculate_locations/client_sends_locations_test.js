'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');
var ObjectID = require('mongodb').ObjectID;

class ClientSendsLocationsTest extends PutCalculateLocationsTest {

	constructor (options) {
		super(options);
		this.numPosts = 0;
	}

	get description () {
		return `should properly calculate and save marker locations when requested, even if ${this.omittedAttribute} is not provided, as long as the client sends locations`;
	}

	setData (callback) {
		super.setData(() => {
			delete this.data.originalCommitHash;
			delete this.data[this.omittedAttribute];
			this.locations = this.data.locations = this.randomLocations();
			callback();
		});
	}

	randomLocations () {
		let locations = {};
		for (let i = 0; i < 20; i++) {
			const markerId = ObjectID();
			locations[markerId] = this.markerFactory.randomLocation();
		}
		return locations;
	}
}

module.exports = ClientSendsLocationsTest;

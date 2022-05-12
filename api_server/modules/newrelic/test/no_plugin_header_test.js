'use strict';

const IngestKeyTest = require('./ingest_key_test');

class NoPluginHeaderTest extends IngestKeyTest {

	get description () {
		return 'should return an error when an attempt is made to fetch the New Relic ingest key without providing the x-cs-plugin-ide header';
	}

	getExpectedError () {
		return {
			error: 'IDE key not present in header'
		};
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-Plugin-IDE'];
			callback();
		});
	}
}

module.exports = NoPluginHeaderTest;

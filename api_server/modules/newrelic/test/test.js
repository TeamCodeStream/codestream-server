// unit tests associated with the New Relic module

'use strict';

// make eslint happy
/* globals describe */

const IngestKeyTest = require('./ingest_key_test');
const NoPluginHeaderTest = require('./no_plugin_header_test');

describe('new relic', function() {

	new IngestKeyTest().test();
	new NoPluginHeaderTest().test();
});

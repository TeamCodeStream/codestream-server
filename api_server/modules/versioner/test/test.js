// unit tests associated with the versioner module

'use strict';

// make eslint happy
/* globals describe */

const VersionerTest = require('./versioner_test');
const UnknownDispositionTest = require('./unknown_disposition_test');
const UnknownIDETest = require('./unknown_ide_test');
const UnknownVersionTest = require('./unknown_version_test');
const IncompatibleVersionTest = require('./incompatible_version_test');
const DeprecatedVersionTest = require('./deprecated_version_test');
const OutdatedVersionTest = require('./outdated_version_test');
const VersionRequestTest = require('./version_request_test');
const UnknownDispositionRequestTest = require('./unknown_disposition_request_test');
const UnknownIDERequestTest = require('./unknown_ide_request_test');
const UnknownVersionRequestTest = require('./unknown_version_request_test');
const IncompatibleVersionRequestTest = require('./incompatible_version_request_test');
const DeprecatedVersionRequestTest = require('./deprecated_version_request_test');
const OutdatedVersionRequestTest = require('./outdated_version_request_test');
const BadVersionTest = require('./bad_version_test');
const BadVersionRequestTest = require('./bad_version_request_test');
const ImproperVersionTest = require('./improper_version_test');
const ImproperVersionRequestTest = require('./improper_version_request_test');
const APIVersionTest = require('./api_version_test');
const CapabilitiesTest = require('./capabilities_test');

describe('versioner', function() {
	this.timeout(5000);

	new VersionerTest().test();
	new UnknownDispositionTest().test();
	new UnknownIDETest().test();
	new UnknownVersionTest().test();
	new IncompatibleVersionTest().test();
	new DeprecatedVersionTest().test();
	new OutdatedVersionTest().test();
	new VersionRequestTest().test();
	new UnknownDispositionRequestTest().test();
	new UnknownIDERequestTest().test();
	new UnknownVersionRequestTest().test();
	new IncompatibleVersionRequestTest().test();
	new DeprecatedVersionRequestTest().test();
	new OutdatedVersionRequestTest().test();
	new BadVersionTest().test();
	new BadVersionRequestTest().test();
	new ImproperVersionTest().test();
	new ImproperVersionRequestTest().test();
	new APIVersionTest().test();
	new CapabilitiesTest().test();
});

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

describe('versioner', function() {

	this.timeout(5000);

    new VersionerTest().test();
    new UnknownDispositionTest().test();
    new UnknownIDETest().test();
    new UnknownVersionTest().test();
    new IncompatibleVersionTest().test();
    new DeprecatedVersionTest().test();
    new OutdatedVersionTest().test();

});

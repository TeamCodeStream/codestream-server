#!/usr/bin/env node

// quick little test script to make sure our configuration migration algorithm is sound
// Migate(), below, should closely match the function migrateNativeConfig() in structured_config_mongo.js

const MIGRATION_MATRIX = [
	[7, 8],
	[12, 13],
	[15, 16],
	[17, 18],
	[18, 19]
];

const TEST_MIGRATIONS = [
];

const Migrate = function(nativeCfg, curVer, targetVer) {
	let migrationVer = curVer;
	let newConfig = Object.assign({}, nativeCfg);
	console.log(`\tmigration from ${curVer} to ${targetVer}`);
	MIGRATION_MATRIX.forEach(([from, to, migrationFunc]) => {
		if (migrationVer < from) {
			migrationVer = from;
		}
		if (migrationVer < targetVer && migrationVer === from) {
			console.log(`\tmigrating config from schema ${from} to schema ${to}`);
			newConfig = migrationFunc(newConfig, from, to) || newConfig;
			migrationVer = to;
		}
	});
	return newConfig;
};

const Prep = function() {
	const firstVersion = MIGRATION_MATRIX[0][0] - 2;
	const lastVersion = MIGRATION_MATRIX[MIGRATION_MATRIX.length - 1][1];
	for (let from = firstVersion; from <= lastVersion - 1; from++) {
		for (let to = from + 1; to <= lastVersion; to++) {
			TEST_MIGRATIONS.push([from, to]);
		}
	}

	for (let i = 0; i < MIGRATION_MATRIX.length; i++) {
		MIGRATION_MATRIX[i].push((cfg, from, to) => {
			console.log(`\t(${from} to ${to} was run)`);
			cfg.from = cfg.from || from;
			cfg.to = to;
			cfg.didRun.push([from, to]);
		});
	}
};

const Test = function() {
	const firstVersion = MIGRATION_MATRIX[0][0];
	TEST_MIGRATIONS.forEach(([from, to]) => {
		console.log(`(Testing ${from} to ${to})`);
		const config = { didRun: [] };
		const finalConfig = Migrate(config, from, to);
		const shouldHaveRun = MIGRATION_MATRIX.filter(([migrateFrom, migrateTo]) => {
			return from >= migrateFrom && from < migrateTo && migrateTo <= to;
		});
		for (let i = 0; i < shouldHaveRun.length; i++) {
			if (!finalConfig.didRun.find(([didRunFrom, didRunTo]) => {
				return shouldHaveRun[i][0] === didRunFrom && shouldHaveRun[i][1] === didRunTo;
			})) {
				console.error(`***** ERROR: should have run ${shouldHaveRun[i][0]},${shouldHaveRun[i][1]} but did not`);
			}
		}
	});
};

Prep();
Test();

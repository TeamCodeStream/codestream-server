
# Common routines for codestream-server sandboxes

# Defaults values
[ -n "$CSBE_NODE_VER" ] && _defaultNodeVersion=$CSBE_NODE_VER || _defaultNodeVersion=16.13.2
[ -z "$CSBE_API_DEFAULT_PORT" ] && export CSBE_API_DEFAULT_PORT=12079

function sbcfg_is_mono_repo_installation {
	[ "$CSSVC_BACKEND_ROOT" = "$CSBE_TOP" ]
}

function sbcfg_get_var {
	local _var=$1
	# local _var="${1}_${2}"
	eval "echo \$${_var}"
}

function sbcfg_set_var {
	local _var="$1" _val="$2"
	# echo ">> _var: $_var    _val: $_val"
	eval "export $_var=$_val"
}

function sbcfg_check_cfg_prop {
	local _prop=$1 _varName=$2
	local _val=$(sbcfg_get_var $_varName)
	local _cfgVal=$(get-json-property -j $CSSVC_CFG_FILE -p $_prop)
	[ "$_cfgVal" != "$_val" ] && echo "**** WARNING: $_varName ($_val) does not match config prop $_prop ($_cfgVal)" && return 1
	return 0
}

function sbcfg_setup_for_newrelic_instrumentation {
	local repoRoot="$1" sandboxTop="$2" shortName="$3"
	[ -n "$NEW_RELIC_METADATA_COMMIT$CSSVC_NEWRELIC_LICENSE_KEY$NEW_RELIC_METADATA_RELEASE_TAG" ] && echo "newrelic instrumentation variables already set" && return
	grep -q licenseIngestKey $CSSVC_CFG_FILE || { echo "licenseIngestKey prop not in config file. No instrumenting today."; return; }
	[ -z "$CSSVC_NEWRELIC_LICENSE_KEY" ] && export CSSVC_NEWRELIC_LICENSE_KEY=$(get-json-property -j $CSSVC_CFG_FILE -p integrations.newrelic.cloud.licenseIngestKey)
	if [ -d "$repoRoot/.git" ]; then
		echo "shortName=$shortName"
		export NEW_RELIC_METADATA_COMMIT=$(cd "$repoRoot" && git rev-parse HEAD)
		export NEW_RELIC_METADATA_RELEASE_TAG="$shortName-$(get-json-property -j "$sandboxTop/package.json" -p version)"
		return
	fi
	# similar logic to server_utils/get_asset_data.js
	[ ! -f "$sandboxTop/package.json" ] && echo "cannot determine SHA for instrumentation. package.json not found" && return
	local assetName=$(get-json-property -j "$sandboxTop/package.json" -p name)
	local assetFile="$sandboxTop/$assetName.info"
	[ ! -f "$assetFile" ] && echo "cannot determine SHA for instrumentation. $assetFile not found" && return
	export NEW_RELIC_METADATA_RELEASE_TAG="$shortName-$(get-json-property -j "$sandboxTop/$assetName.info" -p version)"
	local primaryRepo=$(get-json-property -j "$sandboxTop/$assetName.info" -p primaryRepo)
	export NEW_RELIC_METADATA_COMMIT=$(get-json-property -j "$sandboxTop/$assetName.info" -p repoCommitId.$primaryRepo)
	# accomodate sandbox '-private' repo model for private branch development
	[ -z "$NEW_RELIC_METADATA_COMMIT" ] && export NEW_RELIC_METADATA_COMMIT=$(get-json-property -j "$sandboxTop/$assetName.info" -p repoCommitId.${primaryRepo}-private)
}

function sbcfg_initialize {
	local sbPrefix=$1

	# dynamic sandbox variables
	local sbRoot=$(sbcfg_get_var ${sbPrefix}_SANDBOX)
	local sbEnv=$(sbcfg_get_var ${sbPrefix}_ENV)
	local sbAssetEnv=$(sbcfg_get_var ${sbPrefix}_ASSET_ENV)
	local sbTop=$(sbcfg_get_var ${sbPrefix}_TOP)
	local sbNodeVer=$(sbcfg_get_var ${sbPrefix}_NODE_VER)
	local sbLogs=$(sbcfg_get_var ${sbPrefix}_LOGS)
	local sbTmp=$(sbcfg_get_var ${sbPrefix}_TMP)
	local sbConfs=$(sbcfg_get_var ${sbPrefix}_CONFS)
	local sbData=$(sbcfg_get_var ${sbPrefix}_DATA)
	local sbPids=$(sbcfg_get_var ${sbPrefix}_PIDS)
	local sbCfgFile=$(sbcfg_get_var ${sbPrefix}_CFG_FILE)
	local sbRepoRoot=$(sbcfg_get_var ${sbPrefix}_REPO_ROOT)
	local sbShortName=$(sbcfg_get_var ${sbPrefix}_SHORT_NAME)

	# ----- SANDBOX OPTIONS (for single-service sandboxes only)
	[ -z "$CSBE_TOP" ] && { sandutil_load_options $sbRoot || { echo "failed to load options for $sbRoot" >&2 && return 1; } }

	# ----- NODE & PATH
	if [ -z "$CSBE_NODE_VER" ]; then
		# api sandbox
		[ -z "$sbNodeVer" ] && sbcfg_set_var "${sbPrefix}_NODE_VER" $_defaultNodeVersion && export PATH=$sbRoot/node/bin:$PATH
	else
		# mono repo sandbox
		sbcfg_set_var "${sbPrefix}_NODE_VER" $CSBE_NODE_VER
	fi
	export PATH=$sbTop/node_modules/.bin:$PATH
	export NODE_PATH=$sbTop/node_modules:$NODE_PATH
	export PATH=$sbTop/bin:$PATH

	# ---- CORE VARIABLES
	[ -z "$sbLogs" ] && sbcfg_set_var "${sbPrefix}_LOGS" $sbRoot/log
	[ -z "$sbTmp" ] && sbcfg_set_var "${sbPrefix}_TMP" $sbRoot/tmp
	[ -z "$sbConfs" ] && sbcfg_set_var "${sbPrefix}_CONFS" $sbRoot/conf
	[ -z "$sbData" ] && sbcfg_set_var "${sbPrefix}_DATA" $sbRoot/data
	[ -z "$sbPids" ] && sbcfg_set_var "${sbPrefix}_PIDS" $sbRoot/pid

	# ---- RUN TIME ENVIRONMENT  usually  'local', 'qa', 'prod', 'loadtest1', ...
	# https://github.com/TeamCodeStream/dev_tools/blob/master/README/README.deployments.md)
	[ -n "$CSSVC_ENV" ] && sbcfg_set_var "${sbPrefix}_ENV" $CSSVC_ENV || { [ -n "$sbEnv" ] && export CSSVC_ENV=$sbEnv; }
	[ -z "$CSSVC_ENV" ] && export CSSVC_ENV="local" && sbcfg_set_var "${sbPrefix}_ENV" "local" && echo "CSSVC_ENV=$CSSVC_ENV"

	# ---- ASSET ENVIRONMENT; usually 'local', 'dev' or 'prod'
	# https://github.com/TeamCodeStream/dev_tools/blob/master/README/README.deployments.md)
	[ -z "$sbAssetEnv" ] && sbcfg_set_var "${sbPrefix}_ASSET_ENV" "local"

	# ---- CONFIG

	if [ -n "$CSSVC_CFG_URL" ]; then 
		# ---- config stored in mongo
		# for local development only, CSSVC_CONFIGURATION indicates config file to use for initialization
		if [ "$CSSVC_ENV" = "local"  -a  -n "$CSSVC_CONFIGURATION"  -a  -n "$CS_API_SANDBOX" ]; then
			sandutil_get_codestream_cfg_file "$CS_API_SANDBOX" "$CSSVC_CONFIGURATION" "$CSSVC_ENV" "" noReport
			export CS_API_DEFAULT_CFG_FILE=$CSSVC_CFG_FILE
			unset CSSVC_CFG_FILE
			[ -z "$CS_API_DEFAULT_CFG_FILE" ] && echo "WARN: could not find a config for initialization (using $CSSVC_CONFIGURATION)." || echo "CS_API_DEFAULT_CFG_FILE=$CS_API_DEFAULT_CFG_FILE"
		fi
	else
		# ---- config file
		[ -n "$sbCfgFile" ] && configParm=$sbCfgFile || configParm="$CSSVC_CONFIGURATION"
		[ -z "$CSSVC_CFG_FILE" ] && sandutil_get_codestream_cfg_file $sbRoot "$configParm" "$CSSVC_ENV"

		# ---- Set env vars from config file
		export CSBE_API_DEFAULT_PORT=$(get-json-property -j $CSSVC_CFG_FILE -p apiServer.port)

		# ---- Config File Sanity Check
		[ -n "$sbCfgFile" -a \( "$CSSVC_CFG_FILE" != "$sbCfgFile" \) ] && echo "**** WARNING: ${sbPrefix}_CFG_FILE != CSSVC_CFG_FILE"
		# sbcfg_check_cfg_prop sharedGeneral.runTimeEnvironment CSSVC_ENV || return 1

		echo "CSSVC_CFG_FILE=$CSSVC_CFG_FILE"
	fi

	# For instrumenting backend services
	[ -n "$CSSVC_CFG_FILE" ] && ! sbcfg_is_mono_repo_installation && sbcfg_setup_for_newrelic_instrumentation "$sbRepoRoot" "$sbTop" "$sbShortName"

	# ----- REMOTE DEVELOPMENT SANDBOXES
	# local development on ec2 instances (remote hosts) should reference their
	# hostname and not 'localhost' when constructing URLs so we set
	if [ "$CSSVC_ENV" = "local"  -a  $(sandutil_is_network_instance) -eq 1 ]; then
		export CS_API_PUBLIC_URL="https://`hostname`:$CSBE_API_DEFAULT_PORT"
		echo "CS_API_PUBLIC_URL=$CS_API_PUBLIC_URL [this is a remote development host]"
		[ -n "$DT_USER" ] && export CS_API_CALLBACK_ENV="dev-$DT_USER"
	fi
}

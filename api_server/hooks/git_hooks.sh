
# Common shell functions for use in git hooks

# return 0 if file has changed, 1 if not
githook_file_has_changed() {
	local file=$1
	echo -n "Checking $file..."
	if [[ $(git diff HEAD@{1}..HEAD@{0} -- "${file}" | wc -l) -gt 0 ]]; then
		echo "modified"
		return 0
	fi
	echo "not modified"
	return 1
}

# return 0 if any modues have been modified
githook_module_is_modified() {
	local submod
	local tmpFile=/tmp/modupdated$$
	local rc=1
	for submod in `cat .gitmodules|grep '^\[submodule'|cut -f2 -d\"`; do
		[ ! -f /tmp/updated-mods ] && git status -s | grep "^ M" >$tmpFile
		grep -q "$submod$" $tmpFile && rc=0 && echo "git submodule $submod updated" && break
	done
	/bin/rm $tmpFile
	return $rc
}

# call the config-sandbox script if package.json, package-lock.json or yarn.lock changed or
# if any git submodules' status is modified
githook_reconfigure_sandbox() {
	[ -z "$CS_API_TOP" ] && echo "CS_API_TOP not set" && return
	local call_sandbox_config=0
	githook_module_is_modified && call_sandbox_config=1
	[ $call_sandbox_config -eq 0  -a  -f $CS_API_TOP/package.json ] && githook_file_has_changed $CS_API_TOP/package.json && call_sandbox_config=1
	[ $call_sandbox_config -eq 0  -a  -f $CS_API_TOP/package-lock.json ] && githook_file_has_changed $CS_API_TOP/package-lock.json && call_sandbox_config=1
	# [ $call_sandbox_config -eq 0  -a  "$CS_API_YARN" == "true" ] && githook_file_has_changed $CS_API_TOP/yarn.lock && call_sandbox_config=1
	[ $call_sandbox_config -eq 1 ] && echo "executing $CS_API_TOP/sandbox/configure-sandbox git-hook" && $CS_API_TOP/sandbox/configure-sandbox git-hook
}

[ "$CS_API_DISABLE_GIT_HOOKS" == 1 ] && echo "hooks disabled (CS_API_DISABLE_GIT_HOOKS=1)" && exit 0
[ "$DT_DISABLE_SB_GIT_HOOKS" == 1 ] && echo "hooks disabled (DT_DISABLE_SB_GIT_HOOKS=1)" && exit 0
return 0

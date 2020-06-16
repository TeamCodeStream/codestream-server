
# Common shell functions for use in git hooks (requires the dev_tools framework)

# Determine if a file in the repo has changed
# return 0 if file has changed, 1 otherwise
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

# return 0 if any git submodues have been modified, 1 otherwise
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
    [ -z "$CS_OUTBOUND_EMAIL_TOP" ] && echo "CS_OUTBOUND_EMAIL_TOP not set. Git hook won't run." && return
    local call_sandbox_config=0
    githook_module_is_modified && call_sandbox_config=1
    [ $call_sandbox_config -eq 0  -a  -f package.json ] && githook_file_has_changed package.json && call_sandbox_config=1
	[ $call_sandbox_config -eq 0  -a  -f package-lock.json ] && githook_file_has_changed package-lock.json && call_sandbox_config=1
    [ $call_sandbox_config -eq 0  -a  \( "$CS_OUTBOUND_EMAIL_YARN" == "true"  -o  "$CS_OUTBOUND_EMAIL_YARN" == "1" \) ] && githook_file_has_changed yarn.lock && call_sandbox_config=1
    [ $call_sandbox_config -eq 1 ] && echo "executing sandbox/configure-sandbox git-hook" && sandbox/configure-sandbox git-hook
}

[ "$CS_OUTBOUND_EMAIL_DISABLE_GIT_HOOKS" == 1 ] && echo "hooks disabled (CS_OUTBOUND_EMAIL_DISABLE_GIT_HOOKS=1)" && exit 0
[ "$DT_DISABLE_SB_GIT_HOOKS" == 1 ] && echo "hooks disabled (DT_DISABLE_SB_GIT_HOOKS=1)" && exit 0
return 0

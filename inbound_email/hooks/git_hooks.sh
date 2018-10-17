
# Common shell functions for use in git hooks

# return 1 if file has changed, 0 if not
githook_file_has_changed() {
    local file=$1
    echo -n "Checking $file..."
    if [[ $(git diff HEAD@{1}..HEAD@{0} -- "${file}" | wc -l) -gt 0 ]]; then
        echo "modified"
        return 1
    fi
    echo "not modified"
    return 0
}

githook_reconfigure_sandbox() {
    local update_modules=0
    [ -z "$CS_MAILIN_TOP" ] && echo "CS_MAILIN_TOP not set" && return
    githook_file_has_changed package.json; [ $? -eq 1 ] && update_modules=1
    if [[ "$CS_MAILIN_YARN" == true ]]; then
        githook_file_has_changed yarn.lock; [ $? -eq 1 ] && update_modules=1
    fi
    if [[ $update_modules -eq 1 ]]; then
        echo "Calling configure-sandbox with 'git-hook'"
        $CS_MAILIN_TOP/sandbox/configure-sandbox git-hook
    fi
}

[ "$CS_MAILIN_DISABLE_GIT_HOOKS" == 1 ] && echo "hooks disabled (CS_MAILIN_DISABLE_GIT_HOOKS=1)" && exit 0
[ "$DT_DISABLE_SB_GIT_HOOKS" == 1 ] && echo "hooks disabled (DT_DISABLE_SB_GIT_HOOKS=1)" && exit 0
return 0

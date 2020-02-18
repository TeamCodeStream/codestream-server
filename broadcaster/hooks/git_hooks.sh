
# Common shell functions for use in git hooks

# Determine if a file in the repo has changed
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


# Call the sandbox configure hook if either of the npm library files
# have changed
githook_node_reconfigure_sandbox() {
    local update_modules=0
    [ -z "$CS_BROADCASTER_TOP" ] && echo "CS_BROADCASTER_TOP not set" && return
    githook_file_has_changed package.json; [ $? -eq 1 ] && update_modules=1
    if [ "$CS_BROADCASTER_YARN" == true ]; then
        githook_file_has_changed yarn.lock; [ $? -eq 1 ] && update_modules=1
    fi
    if [ $update_modules -eq 1 ]; then
        echo "andbox/configure-sandbox git-hook"
        sandbox/configure-sandbox git-hook
    fi
}

[ "$CS_BROADCASTER_DISABLE_GIT_HOOKS" == 1 ] && echo "hooks disabled (CS_BROADCASTER_DISABLE_GIT_HOOKS=1)" && exit 0
[ "$DT_DISABLE_SB_GIT_HOOKS" == 1 ] && echo "hooks disabled (DT_DISABLE_SB_GIT_HOOKS=1)" && exit 0
return 0

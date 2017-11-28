
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
    githook_file_has_changed package.json; [ $? -eq 1 ] && update_modules=1
    if [[ "$CS_API_YARN" == true ]]; then
        githook_file_has_changed yarn.lock; [ $? -eq 1 ] && update_modules=1
    fi
    if [[ $update_modules -eq 1 ]]; then
        echo "Rebuilding node_modules"
        $CS_API_TOP/sandbox/configure-sandbox git-hook
    fi
}

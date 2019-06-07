
# Common shell functions for use in git hooks

# Determine if a file in the repo has changed
# return 1 if file has changed, 0 if not
githook_file_has_changed() {
	local file=$1
	echo -n "$file "
	if [[ $(git diff HEAD@{1}..HEAD@{0} -- "${file}" | wc -l) -gt 0 ]]; then
		echo "modified"
		return 1
	fi
	echo "not modified"
	return 0
}

update_docs {
	$GIT_DIR/bin/update-docs >$GIT_DIR/README.parameter-definitions.json
}

# [ "$DT_DISABLE_SB_GIT_HOOKS" == 1 ] && echo "hooks disabled (DT_DISABLE_SB_GIT_HOOKS=1)" && exit 0

return 0

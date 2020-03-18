
# return 0 if new file was created, 1 otherwise
function diff_notify {
	local file=$1 ask=$2
	local ans
	if [ ! -f $file ]; then
		echo "$file is new"
		# echo mv $file.x $file
		mv $file.x $file
		return 0
	fi
	x=`diff $file $file.x|wc -l`
	if [ $x -gt 0 ]; then
		echo "$file has changed"
		if [ -n "$ask" ]; then
			echo -n "update it (y/N)? "
			read ans
			[ "$ans" != y ] && /bin/rm $file.x && echo "skipped" && return 1
		fi
		# echo mv $file.x $file
		mv $file.x $file
	else
		# echo "$file did not change"
		/bin/rm $file.x
		return 1
	fi
	return 0
}

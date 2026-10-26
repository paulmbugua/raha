#!/usr/bin/env bash
set -Eeuo pipefail

source_file=${1:?source fingerprint is required}
target_file=${2:?target fingerprint is required}

diff -u <(sort "$source_file") <(sort "$target_file")
printf 'Database fingerprints match.\n'

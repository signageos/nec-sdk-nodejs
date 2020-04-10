#!/usr/bin/env sh

set -e

TARGET=$1
REPO=$2
if [ -z "$TARGET" ] || [ -z "$REPO" ]; then
    echo "Usage: $0 <target> <dest_repository>"
    exit 1
fi

cd "dist/$TARGET"
abuild -r -P "$REPO"
cd -

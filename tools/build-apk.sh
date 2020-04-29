#!/usr/bin/env sh

set -e

TARGET=$1
REPO=$2
if [ -z "$TARGET" ] || [ -z "$REPO" ]; then
    echo "Usage: $0 <target> <dest_repository>"
    exit 1
fi

cd "dist/$TARGET"
# So far we were building the apk on a real Raspberry Pi because we couldn't figure out a way how to build armhf Alpine packages
# since there's no cross-building option.
# Now we've found a Docker image arm32v6/alpine that if run on 64bit arm system, will emulate 32bit armhf Alpine Linux.
# We'll be running the builds there until we find a better solution.
# It's not perfect however. There are some issues with some binaries and one of the dependencies of display-linux throws an error during installation.
# We don't need to install the dependencies to build this apk anyway because everything is already prebuilt and APKBUILD only copies files.
# Therefore we're removing -r argument which makes it install all dependencies before build.
# We need to add -d argument that makes it skip the dependency check, otherwise it would just fail because we don't have the dependencies installed.
# TODO get a real native armhf machine for building so we don't have to do these hacks and workarounds
abuild -d -P "$REPO"
cd -

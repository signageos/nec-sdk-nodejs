#!/usr/bin/env sh

set -e

TARGET=$1
VERSION=$2
if [ -z "$TARGET" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <target> <version>"
    exit 1
fi

TMP_DIR=tmp/apk

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

tools/make-package-json-public.js dist/server/package.json
cd dist/server
npm install
cd -
cp -r dist "$TMP_DIR"

cp -r common/* "$TMP_DIR"
cp -r $TARGET/* "$TMP_DIR"
cp LICENSE "$TMP_DIR"

sed "s/__pkg_version_placeholder__/${VERSION}/" APKBUILD.dist | sed "s/__target__/$TARGET/" > APKBUILD
cp signageos.pre-install "signageos-$TARGET.pre-install"
cp signageos.post-install "signageos-$TARGET.post-install"

abuild checksum
abuild -r

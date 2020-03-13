#!/usr/bin/env sh

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

TMP_DIR=tmp/apk

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

cp -r dist "$TMP_DIR"
tools/make-package-json-public.js "$TMP_DIR/dist/server/package.json"
cd "$TMP_DIR/dist/server"
npm install
cd -

cp -r common/* "$TMP_DIR"
cp -r rpi3/* "$TMP_DIR"
cp LICENSE "$TMP_DIR"

sed "s/pkgver=\"__pkg_version_placeholder__\"/pkgver=\"${VERSION}\"/" APKBUILD.dist > APKBUILD

abuild checksum
abuild -r

#!/usr/bin/env sh

set -e

TARGET=$1
VERSION=$2
REPO=$3
if [ -z "$TARGET" ] || [ -z "$VERSION" ] || [ -z "$REPO" ]; then
    echo "Usage: $0 <target> <version> <dest_repository>"
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

cd rpi/api/network
npm install
cd -

cd rpi/api/nec
npm install
cd -

cp -r common/* "$TMP_DIR"
cp -r $TARGET/* "$TMP_DIR"
cp LICENSE "$TMP_DIR"
sed -i "s/%VERSION%/${VERSION}/" "${TMP_DIR}/api/signageos"

package_name="signageos-$TARGET"
package_version=`echo $VERSION | sed -r 's/-[^.]+//g' | sed -r 's/\+.+//g'` # omit branch version
sed \
    -e "s/%PKG_VERSION%/${package_version}/" \
    -e "s/%PKG_NAME%/${package_name}/" \
    -e "s/%PLATFORM%/${TARGET}/" \
    APKBUILD.dist > APKBUILD
cp signageos.pre-install "signageos-$TARGET.pre-install"
cp signageos.post-install "signageos-$TARGET.post-install"

abuild checksum
abuild -r -P "$REPO"

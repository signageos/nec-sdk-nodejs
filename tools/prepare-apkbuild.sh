#!/usr/bin/env sh

set -e

TARGET=$1
VERSION=$2
if [ -z "$TARGET" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <target> <version>"
    exit 1
fi

DIST="dist/$TARGET"
FILES_DIRNAME="signageos-$TARGET"
FILES_DIR="$DIST/$FILES_DIRNAME"

mkdir -p "$DIST"
mkdir -p "$FILES_DIR"

cd "$TARGET/api/network"
npm install
cd -

cd "$TARGET/api/nec"
npm install
cd -

tools/make-package-json-public.js dist/server/package.json
cd dist/server
npm install
cd -

cp -r dist/client "$FILES_DIR"
cp -r dist/server "$FILES_DIR"
cp -r common/* "$FILES_DIR"
cp -r $TARGET/* "$FILES_DIR"
cp LICENSE "$FILES_DIR"

sed -i "s/%VERSION%/${VERSION}/" "$FILES_DIR/api/signageos"


cd "$DIST"
tar -czf "$FILES_DIRNAME.tar.gz" "$FILES_DIRNAME"
rm -rf "$FILES_DIRNAME"
cd -

package_name="signageos-$TARGET"
package_version=`echo $VERSION | sed -r 's/-[^.]+//g' | sed -r 's/\+.+//g'` # omit branch version
sed \
    -e "s/%PKG_VERSION%/${package_version}/" \
    -e "s/%PKG_NAME%/${package_name}/" \
    -e "s/%PLATFORM%/${TARGET}/" \
    APKBUILD.dist > "$DIST/APKBUILD"
cp signageos.pre-install "$DIST/signageos-$TARGET.pre-install"
cp signageos.post-install "$DIST/signageos-$TARGET.post-install"

cd "$DIST"
abuild checksum
cd -

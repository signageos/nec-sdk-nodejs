#!/bin/sh

set -e

if [ "$ARCHITECTURE" = "" ]; then
    echo "env variable ARCHITECTURE must be defined"
    exit 1
fi

if [ "$TARGET" = "" ]; then
    echo "env variable TARGET must be defined"
    exit 1
fi

REPO_URL='https://signageos-alpine-repository.s3.eu-central-1.amazonaws.com/1.0/main'
BASE_APKS='alpine-base openssl tzdata chrony openssh eudev libstdc++'
DOCKER_APKS='docker'
SYSMODE_APKS='acct linux-rpi2'
ALL_APKS="$BASE_APKS $DOCKER_APKS $SYSMODE_APKS"
REPO_BASE_PATH=apks
REPO_PATH="$REPO_BASE_PATH/${ARCHITECTURE}"

make_external_apks_dir() {
    mkdir -p "$REPO_PATH"
    touch "$REPO_BASE_PATH/.boot_repository"
}

download_apks() {
    apk fetch --arch "$ARCHITECTURE" --repository "$REPO_URL" -R $ALL_APKS -o "$REPO_PATH"
}

index_apks() {
    cd "$REPO_PATH"
    apk index --rewrite-arch "$ARCHITECTURE" -o APKINDEX.tar.gz ./*.apk
    abuild-sign -k "$PRIVATE_KEY_PATH" -p "$PUBLIC_KEY_FILENAME" APKINDEX.tar.gz
    cd -
}

package_apks() {
    tar -czf "apks-${TARGET}.tar.gz" "$REPO_BASE_PATH"
}

make_external_apks_dir
download_apks
index_apks
package_apks

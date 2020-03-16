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

EXTERNAL_APKS_BASE_URL="https://signageos-alpine-repository.s3.eu-central-1.amazonaws.com/edge/main/${ARCHITECTURE}"
DOCKER_APKS="containerd-1.2.9-r0.apk docker-18.09.8-r0.apk docker-cli-18.09.8-r0.apk docker-engine-18.09.8-r0.apk docker-openrc-18.09.8-r0.apk"
SYSMODE_APKS="acct-6.6.4-r0.apk linux-rpi2-4.19.80-r0.apk cryptsetup-libs-2.1.0-r0.apk json-c-0.13.1-r0.apk linux-firmware-brcm-20191022-r0.apk mkinitfs-3.4.3-r0.apk argon2-libs-20171227-r2.apk device-mapper-libs-2.02.184-r0.apk lddtree-1.26-r2.apk"
EXTERNAL_APKS_FILENAMES="$DOCKER_APKS $SYSMODE_APKS"
EXTERNAL_APKS_PATH="external-apks/${ARCHITECTURE}"

make_external_apks_dir() {
    mkdir -p "$EXTERNAL_APKS_PATH"
}

download_apks() {
    for filename in $EXTERNAL_APKS_FILENAMES
    do
        wget -q -O "${EXTERNAL_APKS_PATH}/${filename}" "${EXTERNAL_APKS_BASE_URL}/${filename}"
    done
}

index_apks() {
    cd "$EXTERNAL_APKS_PATH"
    apk index --rewrite-arch "$ARCHITECTURE" -o APKINDEX.tar.gz ./*.apk
    abuild-sign -k "$PRIVATE_KEY_PATH" -p "$PUBLIC_KEY_FILENAME" APKINDEX.tar.gz
    cd -
}

package_apks() {
    tar -czf "external-apks-${TARGET}.tar.gz" external-apks
}

make_external_apks_dir
download_apks
index_apks
package_apks

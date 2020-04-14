#!/usr/bin/env sh

set -e

build_target() {
    local target=$1
    local arch=$2
    local repo=$PWD/dist
    cd "dist/$target"
    tar -czf "signageos-$target.tar.gz" "signageos-$target"
    abuild checksum
    cd -
    tools/build-apk.sh "$target" "$repo"
    mv dist/dist dist/packages

    # generate and sign index
    cd "dist/packages/$arch"
    rm APKINDEX.tar.gz
    apk index --rewrite-arch "$arch" -o APKINDEX.tar.gz ./*.apk
    echo -n "$alpine_apk_private_key_base64" | base64 -d > .apk_private_key
    abuild-sign -k "$PWD/.apk_private_key" -p "$alpine_apk_public_key_filename" APKINDEX.tar.gz
    rm .apk_private_key
    cd -
}

build_target rpi armhf

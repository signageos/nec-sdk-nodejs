# Maintainer: signageOS <dev@signageos.io>
pkgname="signageos"
pkgver="__pkg_version_placeholder__"
pkgrel=0
pkgdesc="SignageOS client"
url="https://www.signageos.io"
pkgusers="signageos"
pkggroups="signageos"
arch="all"
license="custom"
depends="sudo nodejs ffmpeg nginx vips-dev curl"
makedepends="npm"
options="!check"
subpackages="$pkgname-openrc $pkgname-doc"
source="display-linux.tar.gz
        nginx.conf
        server.initd
        wpewebkit.initd
        restart_wpewebkit.sh
        LICENSE
       "

package() {
	mkdir -p $pkgdir/usr/share/$pkgname
	mkdir -p $pkgdir/var/lib/$pkgname/fs/internal
	mkdir -p $pkgdir/var/lib/$pkgname/system

	cp -r client $pkgdir/usr/share/$pkgname/client
	cp -r server $pkgdir/usr/share/$pkgname/server
	chown -R root:root $pkgdir/usr/share/$pkgname
	chown -R $pkgusers:$pkggroups $pkgdir/var/lib/$pkgname

	ln -sfT /media $pkgdir/var/lib/$pkgname/fs/external

	install -m755 -D restart_wpewebkit.sh "$pkgdir"/usr/lib/signageos/bin/application/restart_client
	install -m755 -D restart_server.sh "$pkgdir"/usr/lib/signageos/bin/application/restart_server

	install -m644 -D nginx.conf "$pkgdir"/etc/nginx/conf.d/$pkgname.conf

	install -m755 -D server.initd "$pkgdir"/etc/init.d/$pkgname-server
	install -m755 -D wpewebkit.initd "$pkgdir"/etc/init.d/$pkgname-wpewebkit

	install -m644 -D LICENSE "$pkgdir"/usr/share/licenses/$pkgname/LICENSE
}

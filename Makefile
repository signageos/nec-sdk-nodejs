DIST=dist
RASPBIAN_DIST=$(DIST)/raspbian
ALPINE_DIST=$(DIST)/alpine

all: dist

raspbian: dist-raspbian
	cp -rT raspbian/DEBIAN $(RASPBIAN_DIST)/DEBIAN
	ls -l $(RASPBIAN_DIST)
	cp -rT raspbian/etc $(RASPBIAN_DIST)/etc
	envsubst < raspbian/control > $(RASPBIAN_DIST)/DEBIAN/control
	chmod 755 $(RASPBIAN_DIST)/DEBIAN/control
	tools/make-package-json-public.js $(RASPBIAN_DIST)/usr/lib/signageos/server/package.json
	cd $(RASPBIAN_DIST)/usr/lib/signageos/server; npm install
	dpkg-deb --build $(RASPBIAN_DIST) $(DIST)/signageos-display-linux.deb

dist-raspbian: dist
	mkdir -p $(RASPBIAN_DIST)/usr/lib/signageos/server
	mkdir -p $(RASPBIAN_DIST)/usr/lib/signageos/client
	mkdir -p $(RASPBIAN_DIST)/var/lib/signageos/fs/internal
	mkdir -p $(RASPBIAN_DIST)/var/lib/signageos/system
	cp -r $(DIST)/client/* $(RASPBIAN_DIST)/usr/lib/signageos/client
	cp -r $(DIST)/server/* $(RASPBIAN_DIST)/usr/lib/signageos/server

alpine: dist
	mkdir -p $(ALPINE_DIST)/
	cp -r $(DIST)/client $(ALPINE_DIST)/client
	cp -r $(DIST)/server $(ALPINE_DIST)/server
	sed "s/pkgver=\"x\"/pkgver=\"${VERSION}\"/" alpine/APKBUILD > $(ALPINE_DIST)/APKBUILD
	cp alpine/signageos.confd $(ALPINE_DIST)/
	cp alpine/signageos.initd $(ALPINE_DIST)/
	tools/make-package-json-public.js $(ALPINE_DIST)/server/package.json
	cd $(ALPINE_DIST)/server; npm install
	cd $(ALPINE_DIST); tar -czf display-linux.tar.gz client server
	cd $(ALPINE_DIST); abuild checksum
	cd $(ALPINE_DIST); abuild -r

dist:
	mkdir -p $(DIST)/server
	mkdir -p $(DIST)/client
	cp README.md $(DIST)
	envsubst < index.html > $(DIST)/client/index.html
	cp node_modules/@signageos/front-display/dist/webWorker.js $(DIST)/client/webWorker.js
	cp node_modules/@signageos/front-osd/dist/index.html $(DIST)/client/osd.html



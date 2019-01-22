import * as should from 'should';
import * as sinon from 'sinon';
import * as NetworkMessages from '../../../../src/Bridge/bridgeNetworkMessages';
import FrontWifi from '../../../../src/Driver/Hardware/FrontWifi';

describe('Driver.Hardware.FrontWifi', function () {

	describe('isEnabled', function () {

		it('should invoke IsWifiEnabled message on bridge', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ isWifiEnabled: true }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.isEnabled();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{ type: NetworkMessages.IsWifiEnabled },
			]);
		});

		it('should return true', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ isWifiEnabled: true }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			const isWifiEnabled = await frontWifi.isEnabled();
			should(isWifiEnabled).be.true();
		});

		it('should return false', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ isWifiEnabled: false }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			const isWifiEnabled = await frontWifi.isEnabled();
			should(isWifiEnabled).be.false();
		});
	});

	describe('enable', function () {

		it('should invoke EnableWifi message on bridge', async function () {
			const bridge = {
				invoke: sinon.stub().resolves(),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.enable();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{ type: NetworkMessages.EnableWifi },
			]);
		});
	});

	describe('disable', function () {

		it('should invoke DisableWifi message on bridge', async function () {
			const bridge = {
				invoke: sinon.stub().resolves(),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.disable();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{ type: NetworkMessages.DisableWifi },
			]);
		});
	});

	describe('connect', function () {

		it('should invoke ConnectToWifi message on bridge with correct ssid', async function () {
			const bridge = {
				invoke: sinon.stub().resolves(),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.connect('ssid1');
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{
					type: NetworkMessages.ConnectToWifi,
					ssid: 'ssid1',
					password: undefined,
				},
			]);
		});

		it('should invoke ConnectToWifi message on bridge with correct ssid and password', async function () {
			const bridge = {
				invoke: sinon.stub().resolves(),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.connect('ssid1', 'password1');
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{
					type: NetworkMessages.ConnectToWifi,
					ssid: 'ssid1',
					password: 'password1',
				},
			]);
		});
	});

	describe('disconnect', function () {

		it('should invoke DisconnectFromWifi message on bridge', async function () {
			const bridge = {
				invoke: sinon.stub().resolves(),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.disconnect();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{
					type: NetworkMessages.DisconnectFromWifi,
				},
			]);
		});
	});

	describe('getConnectedTo', function () {

		it('should invoke GetConnectedToWifi message on bridge', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ ssid: 'ssid1' }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.getConnectedTo();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{
					type: NetworkMessages.GetConnectedToWifi,
				},
			]);
		});

		it('should return correct ssid', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ ssid: 'ssid1' }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			const ssid = await frontWifi.getConnectedTo();
			should(ssid).be.equal('ssid1');
		});

		it('should return null', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ ssid: null }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			const ssid = await frontWifi.getConnectedTo();
			should(ssid).be.null();
		});
	});

	describe('getCountry', function () {

		it('should invoke GetWifiCountryCode message on bridge', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ countryCode: 'CZ' }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.getCountry();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{
					type: NetworkMessages.GetWifiCountryCode,
				},
			]);
		});

		it('should return correct country code', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ countryCode: 'CZ' }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			const countryCode = await frontWifi.getCountry();
			should(countryCode).be.equal('CZ');
		});

		it('should return null', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ countryCode: null }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			const countryCode = await frontWifi.getCountry();
			should(countryCode).be.null();
		});
	});

	describe('setCountry', function () {

		it('should invoke SetWifiCountryCode message on bridge with correct country code', async function () {
			const bridge = {
				invoke: sinon.stub().resolves(),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.setCountry('US');
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{
					type: NetworkMessages.SetWifiCountryCode,
					countryCode: 'US',
				},
			]);
		});
	});

	describe('scan', function () {

		it('should invoke ScanWifiDevices message on bridge', async function () {
			const bridge = {
				invoke: sinon.stub().resolves({ devices: [] }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			await frontWifi.scan();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args.should.deepEqual([
				{
					type: NetworkMessages.ScanWifiDevices,
				},
			]);
		});

		it('should return device list', async function () {
			const devices = [
				{ ssid: 'device1', encrypted: false },
				{ ssid: 'device2', encrypted: true },
				{ ssid: 'device3', encrypted: true },
			];
			const bridge = {
				invoke: sinon.stub().resolves({ devices }),
			};
			const frontWifi = new FrontWifi(bridge as any);
			const scannedDevices = await frontWifi.scan();
			should(scannedDevices).be.deepEqual(devices);
		});
	});
});

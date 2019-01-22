import IWifi, { IWifiDevice } from '@signageos/front-display/es6/NativeDevice/Hardware/IWifi';
import * as NetworkMessages from '../../Bridge/bridgeNetworkMessages';
import BridgeClient from '../../Bridge/BridgeClient';

export default class FrontWifi implements IWifi {

	constructor(private bridge: BridgeClient) {}

	public async isEnabled(): Promise<boolean> {
		const { isWifiEnabled } = await this.bridge.invoke<NetworkMessages.IsWifiEnabled, { isWifiEnabled: boolean }>({
			type: NetworkMessages.IsWifiEnabled,
		});
		return isWifiEnabled;
	}

	public async enable(): Promise<void> {
		await this.bridge.invoke<NetworkMessages.EnableWifi, {}>({
			type: NetworkMessages.EnableWifi,
		});
	}

	public async disable(): Promise<void> {
		await this.bridge.invoke<NetworkMessages.DisableWifi, {}>({
			type: NetworkMessages.DisableWifi,
		});
	}

	public async connect(ssid: string, password?: string): Promise<void> {
		await this.bridge.invoke<NetworkMessages.ConnectToWifi, {}>({
			type: NetworkMessages.ConnectToWifi,
			ssid,
			password,
		});
	}

	public async disconnect(): Promise<void> {
		await this.bridge.invoke<NetworkMessages.DisconnectFromWifi, {}>({
			type: NetworkMessages.DisconnectFromWifi,
		});
	}

	public async getConnectedTo(): Promise<string | null> {
		const { ssid } = await this.bridge.invoke<NetworkMessages.GetConnectedToWifi, { ssid: string | null }>({
			type: NetworkMessages.GetConnectedToWifi,
		});
		return ssid;
	}

	public async getCountry(): Promise<string | null> {
		const { countryCode } = await this.bridge.invoke<NetworkMessages.GetWifiCountryCode, { countryCode: string | null }>({
			type: NetworkMessages.GetWifiCountryCode,
		});
		return countryCode;
	}

	public async setCountry(countryCode: string): Promise<void> {
		await this.bridge.invoke<NetworkMessages.SetWifiCountryCode, {}>({
			type: NetworkMessages.SetWifiCountryCode,
			countryCode,
		});
	}

	public async scan(): Promise<IWifiDevice[]> {
		const { devices } = await this.bridge.invoke<NetworkMessages.ScanWifiDevices, { devices: IWifiDevice[] }>({
			type: NetworkMessages.ScanWifiDevices,
		});
		return devices;
	}
}

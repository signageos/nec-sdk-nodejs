export const ProximitySensorChange = 'Sensors.Proximity.Change';
export interface ProximitySensorChange {
	type: typeof ProximitySensorChange;
	detected: boolean;
}

import IManagementFileSystem from '@signageos/front-display/es6/NativeDevice/Management/IFileSystem';
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import IFileSystem from '../FileSystem/IFileSystem';

export default class ManagementFileSystem implements IManagementFileSystem {

	constructor(private fileSystem: IFileSystem) {}

	public listStorageUnits(): Promise<IStorageUnit[]> {
		return this.fileSystem.listStorageUnits();
	}

	public onStorageUnitsChanged(listener: () => void): void {
		this.fileSystem.onStorageUnitsChanged(listener);
	}
}

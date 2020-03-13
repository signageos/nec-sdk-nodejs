import * as path from 'path';
import * as fs from 'fs-extra';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import VideoOrientation from '@signageos/front-display/es6/Video/Orientation';
import ISystemSettings from './ISystemSettings';

const DEFAULT_VOLUME = 100;
const DEFAULT_SCREEN_ORIENTATION = Orientation.LANDSCAPE;

export default class FSSystemSettings implements ISystemSettings {

	private settings: {
		volume?: number;
		screenOrientation?: keyof typeof Orientation;
		videoOrientation?: keyof typeof VideoOrientation;
	} = {};
	private loadedFromFS: boolean = false;

	constructor(private fileSystemBasePath: string) {}

	public async getVolume(): Promise<number> {
		await this.loadFromFileSystemIfNotLoaded();
		if (typeof this.settings.volume === 'undefined') {
			return DEFAULT_VOLUME;
		}
		return this.settings.volume;
	}

	public async setVolume(volume: number): Promise<void> {
		if (volume < 0 || volume > 100) {
			throw new Error('Invalid volume, must be an integer between 0-100');
		}
		this.settings.volume = Math.trunc(volume);
		await this.saveToFileSystem();
	}

	public async getScreenOrientation(): Promise<Orientation> {
		await this.loadFromFileSystemIfNotLoaded();
		if (typeof this.settings.screenOrientation === 'undefined') {
			return DEFAULT_SCREEN_ORIENTATION;
		}
		return Orientation[this.settings.screenOrientation];
	}

	public async getVideoOrientation(): Promise<VideoOrientation | null> {
		await this.loadFromFileSystemIfNotLoaded();
		if (typeof this.settings.videoOrientation !== 'undefined') {
			return VideoOrientation[this.settings.videoOrientation];
		} else {
			return null;
		}
	}

	public async setScreenOrientation(orientation: Orientation, videoOrientation?: VideoOrientation): Promise<void> {
		this.settings.screenOrientation = Orientation[orientation] as keyof typeof Orientation;
		if (typeof videoOrientation !== 'undefined') {
			this.settings.videoOrientation = VideoOrientation[videoOrientation] as keyof typeof VideoOrientation;
		} else {
			delete this.settings.videoOrientation;
		}
		await this.saveToFileSystem();
	}

	private async loadFromFileSystemIfNotLoaded() {
		if (!this.loadedFromFS) {
			await this.loadFromFileSystem();
			this.loadedFromFS = true;
		}
	}

	private async loadFromFileSystem() {
		const filePath = this.getSettingsFilePath();
		try {
			if (await fs.pathExists(filePath)) {
				const fileContentsBuffer = await fs.readFile(filePath);
				this.settings = JSON.parse(fileContentsBuffer.toString());
			} else {
				this.settings = {};
			}
		} catch (error) {
			console.error('Failed to load system settings from file system', error);
			this.settings = {};
		}
	}

	private async saveToFileSystem() {
		const filePath = this.getSettingsFilePath();
		const settingsJSON = JSON.stringify(this.settings);
		try {
			await fs.writeFile(filePath, settingsJSON);
		} catch (error) {
			console.error('Failed to save system settings to file system', error);
		}
	}

	private getSettingsFilePath() {
		return path.join(this.fileSystemBasePath, 'system_settings.json');
	}
}

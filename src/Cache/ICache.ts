export default interface ICache {
	get(uid: string): Promise<string | null>;
	delete(uid: string): Promise<void>;
	save(uid: string, content: string): Promise<void>;
}

import { execApiCommand } from './apiCommand';

export async function isNEC() {
	const result = await execApiCommand('nec', 'is_nec', [], { asRoot: true });
	return result.trim() === '1';
}

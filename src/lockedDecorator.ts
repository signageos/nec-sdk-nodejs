import * as AsyncLock from 'async-lock';
const CircularJSON = require('circular-json');

export interface IOptions {
	timeout?: number;
	maxPending?: number;
	domainReentrant?: boolean;
}

const asyncLock = new AsyncLock();

export function locked(key: string | string[], options?: IOptions) {
	return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;
		descriptor.value = function (...args: any[]) {
			return asyncLock.acquire(
				key,
				async () => {
					const returnValuePromise = originalMethod.apply(this, args);
					if (!(returnValuePromise instanceof Promise)) {
						throw new Error(`Synchronous methods must return Promise instance. But ${CircularJSON.stringify(returnValuePromise)} given.`);
					}
					return await returnValuePromise;
				},
				options,
			);
		};
	};
}

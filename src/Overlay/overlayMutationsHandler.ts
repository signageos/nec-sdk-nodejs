import BridgeClient from '../Bridge/BridgeClient';
import { Hide } from '../Bridge/bridgeOverlayMessages';

const html2canvas = require('html2canvas');

export async function handleMutations(window: Window, bridge: BridgeClient, mutations: MutationRecord[]) {
	for (let mutation of mutations) {
		switch (mutation.type) {
			case 'attributes':
			case 'characterData':
				await handleAttributeOrCharacterDataMutation(window, bridge, mutation);
				break;
			case 'childList':
				await handleChildListMutation(window, bridge, mutation);
				break;
			default:
		}
	}
}

async function handleAttributeOrCharacterDataMutation(window: Window, bridge: BridgeClient, mutation: MutationRecord) {
	const overlayRoot = getOverlayRootInParentTree(window, mutation.target as HTMLElement);
	if (overlayRoot) {
		let visible = false;
		if (overlayRoot.offsetParent !== null) {
			const computedStyle = window.getComputedStyle(overlayRoot);
			if ((!computedStyle.display || computedStyle.display !== 'none') &&
				(!computedStyle.visibility || computedStyle.visibility !== 'hidden')
			) {
				visible = true;
			}
		}

		if (visible) {
			await renderOverlay(bridge, overlayRoot);
		} else {
			await removeOverlay(bridge, overlayRoot);
		}
	}
}

async function handleChildListMutation(window: Window, bridge: BridgeClient, mutation: MutationRecord) {
	let subtreeContainsOverlays = false;

	for (let i = 0; i < mutation.addedNodes.length; i++) {
		const addedNode = mutation.addedNodes[i] as HTMLElement;
		if (isOverlay(addedNode)) {
			await renderOverlay(bridge, addedNode);
			subtreeContainsOverlays = true;
		} else {
			const overlaysInSubtree = getOverlayRootsInSubtree(addedNode);
			if (overlaysInSubtree.length > 0) {
				await Promise.all(
					overlaysInSubtree.map(
						(overlayInSubtree: HTMLElement) => renderOverlay(bridge, overlayInSubtree),
					),
				);
				subtreeContainsOverlays = true;
			}
		}
	}

	for (let i = 0; i < mutation.removedNodes.length; i++) {
		const removedNode = mutation.removedNodes[i] as HTMLElement;
		if (isOverlay(removedNode)) {
			await removeOverlay(bridge, removedNode);
			subtreeContainsOverlays = true;
		} else {
			const overlaysInSubtree = getOverlayRootsInSubtree(removedNode);
			if (overlaysInSubtree.length > 0) {
				await Promise.all(
					overlaysInSubtree.map(
						(overlayInSubtree: HTMLElement) => removeOverlay(bridge, overlayInSubtree),
					),
				);
				subtreeContainsOverlays = true;
			}
		}
	}

	if (!subtreeContainsOverlays) {
		const overlayRootInParentTree = getOverlayRootInParentTree(window, mutation.target as HTMLElement);
		if (overlayRootInParentTree) {
			await renderOverlay(bridge, overlayRootInParentTree);
		}
	}
}

function getOverlayRootInParentTree(window: Window, element: HTMLElement): HTMLElement | null {
	if (element === window.document.body) {
		return null;
	}
	if (isOverlay(element)) {
		return element;
	}
	if (!element.parentElement) {
		return null;
	}
	return getOverlayRootInParentTree(window, element.parentElement);
}

function getOverlayRootsInSubtree(element: HTMLElement) {
	const result: HTMLElement[] = [];
	for (let i = 0; i < element.childNodes.length; i++) {
		const childElement = element.childNodes[i] as HTMLElement;
		if (isOverlay(childElement)) {
			result.push(childElement);
		} else {
			result.push(...getOverlayRootsInSubtree(childElement));
		}
	}

	return result;
}

function isOverlay(element: HTMLElement) {
	return element.dataset && element.dataset.overlay === 'true';
}

async function renderOverlay(bridge: BridgeClient, overlayElement: HTMLElement) {
	if (overlayElement.id) {
		const appletUid = ''; // TODO
		await renderOverlayIntoImageAndUpload(bridge, appletUid, overlayElement);
	} else {
		console.warn("Can\'t render overlay without an id");
	}

}

async function removeOverlay(bridge: BridgeClient, overlayElement: HTMLElement) {
	if (overlayElement.id) {
		await bridge.invoke<Hide, {}>({
			type: Hide,
			id: overlayElement.id,
			appletUid: '', // TODO
		});
	} else {
		console.warn("Can\'t render overlay without an id");
	}
}

async function renderOverlayIntoImageAndUpload(bridge: BridgeClient, appletUid: string, overlayElement: HTMLElement) {
	const CANVAS_SIZE_LIMIT = 16383;
	const attributes = getOverlayElementsAttributes(overlayElement);
	const canvas = await html2canvas(overlayElement, {
		backgroundColor: null,
		width: Math.min(attributes.width, CANVAS_SIZE_LIMIT),
		height: Math.min(attributes.height, CANVAS_SIZE_LIMIT),
		logging: false,
	});
	const canvasBlob = await new Promise<Blob | null>((resolve: (blob: Blob | null) => void) => {
		canvas.toBlob(resolve);
	});
	if (!canvasBlob) {
		throw new Error('Couldn\'t render overlay');
	}
	await bridge.uploadOverlay(
		canvasBlob,
		attributes.id,
		appletUid,
		attributes.width,
		attributes.height,
		attributes.x,
		attributes.y,
		attributes.horizontalTranslation,
		attributes.verticalTranslation,
		attributes.maxHorizontalOffset,
		attributes.maxVerticalOffset,
	);
}

function getOverlayElementsAttributes(overlayElement: HTMLElement): {
	id: string,
	x: number,
	y: number,
	width: number,
	height: number,
	horizontalTranslation?: number,
	verticalTranslation?: number,
	maxHorizontalOffset?: number,
	maxVerticalOffset?: number,
} {
	const rectangle = overlayElement.getBoundingClientRect();
	const horizontalTranslation = overlayElement.dataset.overlayHorizontalTranslation;
	const verticalTranslation = overlayElement.dataset.overlayVerticalTranslation;
	const maxHorizontalOffset = overlayElement.dataset.overlayMaxHorizontalOffset;
	const maxVerticalOffset = overlayElement.dataset.overlayMaxVerticalOffset;

	return {
		id: overlayElement.id,
		x: Math.trunc(rectangle.left),
		y: Math.trunc(rectangle.top),
		width: Math.trunc(rectangle.width),
		height: Math.trunc(rectangle.height),
		horizontalTranslation: horizontalTranslation ? parseInt(horizontalTranslation, 10) : undefined,
		verticalTranslation: verticalTranslation ? parseInt(verticalTranslation, 10) : undefined,
		maxHorizontalOffset: maxHorizontalOffset ? parseInt(maxHorizontalOffset, 10) : undefined,
		maxVerticalOffset: maxVerticalOffset ? parseInt(maxVerticalOffset, 10) : undefined,
	};
}

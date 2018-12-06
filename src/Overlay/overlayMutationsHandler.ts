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
			await renderOverlay(window, bridge, overlayRoot);
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
			await renderOverlay(window, bridge, addedNode);
			subtreeContainsOverlays = true;
		} else {
			const overlaysInSubtree = getOverlayRootsInSubtree(addedNode);
			if (overlaysInSubtree.length > 0) {
				await Promise.all(
					overlaysInSubtree.map(
						(overlayInSubtree: HTMLElement) => renderOverlay(window, bridge, overlayInSubtree),
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
			await renderOverlay(window, bridge, overlayRootInParentTree);
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

async function renderOverlay(window: Window, bridge: BridgeClient, overlayElement: HTMLElement) {
	if (overlayElement.id) {
		const appletUid = ''; // TODO
		await renderOverlayIntoImageAndUpload(window, bridge, appletUid, overlayElement);
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

async function renderOverlayIntoImageAndUpload(window: Window, bridge: BridgeClient, appletUid: string, overlayElement: HTMLElement) {
	const CANVAS_SIZE_LIMIT = 16383;
	const attributes = getOverlayElementsAttributes(window, overlayElement);
	const canvas = await html2canvas(overlayElement, {
		backgroundColor: null,
		width: Math.min(attributes.rectangle.width, CANVAS_SIZE_LIMIT),
		height: Math.min(attributes.rectangle.height, CANVAS_SIZE_LIMIT),
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
		overlayElement.id,
		appletUid,
		attributes.rectangle.width,
		attributes.rectangle.height,
		attributes.rectangle.x,
		attributes.rectangle.y,
		attributes.animation,
	);
}

interface IRectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface IAnimationKeyframe {
	percentage: number;
	style: CSSStyleDeclaration;
}

interface IAnimation {
	name: string;
	duration: number;
	keyfames: IAnimationKeyframe[];
}

function getOverlayElementsAttributes(window: Window, overlayElement: HTMLElement): {
	rectangle: IRectangle;
	animation?: {
		duration: number;
		keyframes: {
			percentage: number;
			rectangle: IRectangle;
		}[];
	};
} {
	const rectangle = getElementsRectangle(overlayElement);
	const animation = getElementsAnimation(window, overlayElement);
	if (animation) {
		return {
			rectangle,
			animation: {
				duration: animation.duration,
				keyframes: animation.keyfames.map((keyframe: IAnimationKeyframe) => ({
					percentage: keyframe.percentage,
					rectangle: applyKeyframeStylesAndGetRectangle(overlayElement, keyframe),
				})),
			},
		};
	}

	return { rectangle };
}

function applyKeyframeStylesAndGetRectangle(element: HTMLElement, keyframe: IAnimationKeyframe): IRectangle {
	if (!element.parentElement) {
		throw new Error('Element is missing a parent element');
	}

	const applyStyles = [ 'left', 'right', 'top', 'bottom' ];
	const cloneElement = element.cloneNode(true) as HTMLElement;
	delete cloneElement.dataset.overlay;
	for (let key of applyStyles) {
		if ((keyframe.style as any)[key]) {
			(cloneElement.style as any)[key] = (keyframe.style as any)[key];
		}
	}
	cloneElement.style.visibility = 'hidden';
	cloneElement.style.animation = 'none';
	element.parentElement.appendChild(cloneElement);
	const rectangle = getElementsRectangle(cloneElement);
	element.parentElement.removeChild(cloneElement);
	return rectangle;
}

function getElementsRectangle(element: HTMLElement): IRectangle {
	const rectangle = element.getBoundingClientRect();
	return {
		x: Math.trunc(rectangle.left),
		y: Math.trunc(rectangle.top),
		width: Math.trunc(rectangle.width),
		height: Math.trunc(rectangle.height),
	};
}

function getElementsAnimation(window: Window, element: HTMLElement): IAnimation | null {
	const computedStyle = window.getComputedStyle(element);
	if (computedStyle.animation) {
		const animationName = computedStyle.animationName;
		const animationDuration = computedStyle.animationDuration;
		if (!animationName || !animationDuration) {
			return null;
		}
		const animationDurationInMs = parseAnimationDuration(animationDuration);
		if (animationDurationInMs <= 0) {
			return null;
		}

		const animationKeyframes = getAnimationKeyframesByName(window, animationName);
		if (animationKeyframes.length === 0) {
			return null;
		}

		return {
			name: animationName,
			duration: animationDurationInMs,
			keyfames: animationKeyframes,
		};
	}
	return null;
}

function parseAnimationDuration(animationDuration: string) {
	if (/ms$/.test(animationDuration)) {
		const durationInMs = parseFloat(animationDuration);
		return isNaN(durationInMs) ? 0 : durationInMs;
	}
	if (/s$/.test(animationDuration)) {
		const durationInS = parseFloat(animationDuration);
		return isNaN(durationInS) ? 0 : durationInS * 1000;
	}
	return 0;
}

function getAnimationKeyframesByName(window: Window, animationName: string): IAnimationKeyframe[] {
	let keyframes: IAnimationKeyframe[] = [];
	for (let i = 0; i < window.document.styleSheets.length; i++) {
		const stylesheet = window.document.styleSheets[i] as CSSStyleSheet;
		if (stylesheet.cssRules) {
			for (let j = 0; j < stylesheet.cssRules.length; j++) {
				const cssRule = stylesheet.cssRules[j] as CSSKeyframesRule;
				if (cssRule.type === (window as any).CSSRule.KEYFRAMES_RULE && cssRule.name === animationName) {
					keyframes = convertCssKeyframesRuleIntoKeyframeList(cssRule);
				}
			}
		}
	}
	return keyframes;
}

function convertCssKeyframesRuleIntoKeyframeList(cssRule: CSSKeyframesRule) {
	const keyframes: IAnimationKeyframe[] = [];
	for (let i = 0; i < cssRule.cssRules.length; i++) {
		const keyframeRule = cssRule.cssRules[i] as CSSKeyframeRule;
		if (keyframeRule.type === (window as any).CSSRule.KEYFRAME_RULE) {
			let percentage: number;
			if (keyframeRule.keyText === 'from') {
				percentage = 0;
			} else if (keyframeRule.keyText === 'to') {
				percentage = 100;
			} else if (/%$/.test(keyframeRule.keyText)) {
				percentage = parseInt(keyframeRule.keyText);
				if (isNaN(percentage)) {
					continue;
				}
			} else {
				continue;
			}

			keyframes.push({
				percentage,
				style: keyframeRule.style,
			});
		}
	}
	return keyframes;
}

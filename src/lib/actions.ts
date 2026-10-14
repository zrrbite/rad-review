/**
 * Svelte action: ignore Enter on this element while the key is held down or for
 * `delayMs` after it appears, so a double tap meant for the previous form can't
 * skip straight past it.
 */
export function ignoreHastyEnter(node: HTMLElement, delayMs = 500) {
	const shownAt = performance.now();
	const onKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && (event.repeat || performance.now() - shownAt < delayMs)) event.preventDefault();
	};
	node.addEventListener('keydown', onKeydown);
	return { destroy: () => node.removeEventListener('keydown', onKeydown) };
}

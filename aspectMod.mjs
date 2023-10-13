//PX = [r, g, b, a] in 255 range

export function modify (pxRGBA) {
	pxRGBA[3] = 200
	return pxRGBA
}

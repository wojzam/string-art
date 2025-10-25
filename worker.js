let stopFlag = false;

self.onmessage = function (e) {
    if (e.data.cmd === 'start') {
        stopFlag = false;
        const { imageData, pins, maxLines, scale } = e.data;
        runStringArt(imageData, pins, maxLines, scale);
    } else if (e.data.cmd === 'stop') {
        stopFlag = true;
    }
};

function runStringArt(imageData, pins, maxLines, scale) {
    const width = imageData.width * scale;
    const height = imageData.height * scale;
    const targetPixels = new Float32Array(width * height);
    const currentPixels = new Float32Array(width * height).fill(255);
    const data = imageData.data;
    for (let i = 0; i < imageData.width * imageData.height; i++) {
        targetPixels[i] = data[i * 4];
    }
    const scaledPins = pins.map(p => ({ x: p.x * scale, y: p.y * scale }));
    const nPins = scaledPins.length;
    const lineSequence = [];

    function getLinePixels(x0, y0, x1, y1) {
        const pixels = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let x = x0, y = y0;
        while (true) {
            pixels.push({ x, y });
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
        }
        return pixels;
    }

    function applyLine(pixels, strength = 0.002) {
        for (const p of pixels) {
            const idx = p.y * width + p.x;
            currentPixels[idx] = Math.max(0, currentPixels[idx] - strength * 255);
        }
    }

    function computeReduction(pixels) {
        let sum = 0;
        for (const p of pixels) {
            const idx = p.y * width + p.x;
            sum += Math.max(0, currentPixels[idx] - targetPixels[idx]);
        }
        return sum;
    }

    // Precompute all possible lines
    const allLines = [];
    for (let i = 0; i < nPins; i++) {
        for (let j = i + 1; j < nPins; j++) {
            const line = getLinePixels(Math.round(scaledPins[i].x), Math.round(scaledPins[i].y),
                Math.round(scaledPins[j].x), Math.round(scaledPins[j].y));
            allLines.push({ from: i, to: j, pixels: line });
        }
    }

    let lastPreviewTime = 0;
    const previewInterval = 100; // send preview every 100ms

    for (let k = 0; k < maxLines; k++) {
        if (stopFlag) break;
        let bestLine = null, bestRed = -1;
        for (const line of allLines) {
            const r = computeReduction(line.pixels);
            if (r > bestRed) { bestRed = r; bestLine = line; }
        }
        if (bestLine) {
            applyLine(bestLine.pixels);
            lineSequence.push({ from: bestLine.from, to: bestLine.to });
        }

        // send progress + preview every 50 lines
        if (k % 50 === 0 || k === maxLines - 1) {
            self.postMessage({ type: 'progress', value: Math.floor(k / maxLines * 100), sequence: lineSequence });
        }
    }
    self.postMessage({ type: 'done', sequence: lineSequence });
}

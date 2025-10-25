import { PinsGenerator } from './PinsGenerator.js';
import { buildTarget } from './ImageUtils.js';

/**
 * Main worker entry point.
 */
self.onmessage = function (e) {
    if (e.data.cmd === 'generate') {
        const { imageData, pinsCount, maxLines, targetOptions } = e.data;

        const cx = imageData.width / 2;
        const cy = imageData.height / 2;
        const radius = Math.min(cx, cy) * 0.95; // Use 95% of radius

        const pins = PinsGenerator.generate(cx, cy, radius, pinsCount);

        const result = generateStringArt(imageData, pins, maxLines, targetOptions);

        self.postMessage({ type: 'done', full: result });
    }
};

/**
 * The core string art algorithm.
 * @param {ImageData} imgData - The source image pixel data.
 * @param {Array} pins - Array of {x, y} pin coordinates.
 * @param {number} maxLines - The maximum number of lines to generate.
 * @param {object} targetOptions - Options for building the target map.
 */
function generateStringArt(imgData, pins, maxLines, targetOptions) {
    const w = imgData.width;
    const h = imgData.height;

    // 1. Build the target map (combination of edges and intensity)
    const target = buildTarget(imgData, targetOptions);

    // 2. Create a "canvas" to track drawn lines (simulates darkness)
    const lineCanvas = new Float32Array(w * h).fill(255); // Start as white

    const sequence = [];
    let currentPin = 0;
    let lastPin = -1;
    const stepPreview = Math.min(200, Math.floor(maxLines / 20));

    for (let step = 0; step < maxLines; step++) {
        let bestScore = -Infinity;
        let bestPin = -1;

        for (let nextPin = 0; nextPin < pins.length; nextPin++) {
            if (nextPin === currentPin || nextPin === lastPin) continue;

            const score = calculateLineScore(lineCanvas, target, pins[currentPin], pins[nextPin], w, h);

            if (score > bestScore) {
                bestScore = score;
                bestPin = nextPin;
            }
        }

        if (bestPin === -1) {
            break; // No good line found
        }

        // 4. "Draw" the best line onto the virtual canvas
        const lineIntensity = 10;
        drawLine(lineCanvas, pins[currentPin], pins[bestPin], w, h, lineIntensity);

        sequence.push({ from: currentPin, to: bestPin });

        lastPin = currentPin;
        currentPin = bestPin;

        // 5. Post progress update
        if (step % stepPreview === 0) {
            self.postMessage({
                type: 'progress',
                progress: (step / maxLines) * 100,
                partial: { seq: sequence.slice(), pins }
            });
        }
    }

    return { sequence, pins };
}

function calculateLineScore(lineCanvas, targetMap, p1, p2, w, h) {
    let score = 0;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return 0;

    for (let i = 0; i <= steps; i++) {
        const x = Math.floor(p1.x + (dx * i) / steps);
        const y = Math.floor(p1.y + (dy * i) / steps);

        if (x < 0 || x >= w || y < 0 || y >= h) continue;

        const idx = y * w + x;

        score += (lineCanvas[idx] - targetMap[idx]);
    }
    return score / steps;
}

function drawLine(lineCanvas, p1, p2, w, h, intensity) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return;

    for (let i = 0; i <= steps; i++) {
        const x = Math.floor(p1.x + (dx * i) / steps);
        const y = Math.floor(p1.y + (dy * i) / steps);

        if (x < 0 || x >= w || y < 0 || y >= h) continue;

        const idx = y * w + x;
        lineCanvas[idx] = Math.max(0, lineCanvas[idx] - intensity);
    }
}
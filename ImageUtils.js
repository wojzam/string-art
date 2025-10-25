/**
 * Utility functions for image processing inside the worker.
 * These functions operate directly on pixel arrays, not DOM elements.
 */

/**
 * Applies a simple box blur.
 * (This function is no longer called by buildTarget,
 * but is kept here for potential future use).
 */
function boxBlur(pixels, w, h, passes = 1) {
    let src = pixels;
    let out = new Uint8ClampedArray(pixels.length);

    for (let p = 0; p < passes; p++) {
        const tmp = new Uint8ClampedArray(src.length);

        // Horizontal pass
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const left = (x - 1 >= 0) ? src[y * w + (x - 1)] : src[idx];
                const mid = src[idx];
                const right = (x + 1 < w) ? src[y * w + (x + 1)] : src[idx];
                tmp[idx] = Math.round((left + mid + right) / 3);
            }
        }

        // Vertical pass
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                const idx = y * w + x;
                const top = (y - 1 >= 0) ? tmp[(y - 1) * w + x] : tmp[idx];
                const mid = tmp[idx];
                const bot = (y + 1 < h) ? tmp[(y + 1) * w + x] : tmp[idx];
                out[idx] = Math.round((top + mid + bot) / 3);
            }
        }
        src = out;
    }
    return out;
}

/**
 * Applies the Sobel operator to find edge magnitudes.
 */
function sobelMagnitude(grayPixels, w, h) {
    const mag = new Uint8ClampedArray(w * h);
    // Gx: [-1 0 1; -2 0 2; -1 0 1]
    // Gy: [-1 -2 -1; 0 0 0; 1 2 1]

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const p00 = grayPixels[(y - 1) * w + (x - 1)];
            const p01 = grayPixels[(y - 1) * w + x];
            const p02 = grayPixels[(y - 1) * w + (x + 1)];
            const p10 = grayPixels[y * w + (x - 1)];
            const p12 = grayPixels[y * w + (x + 1)];
            const p20 = grayPixels[(y + 1) * w + (x - 1)];
            const p21 = grayPixels[(y + 1) * w + x];
            const p22 = grayPixels[(y + 1) * w + (x + 1)];

            const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
            const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

            mag[y * w + x] = Math.min(255, Math.hypot(gx, gy));
        }
    }
    return mag;
}

/**
 * Builds the target "darkness map" for the algorithm.
 */
export function buildTarget(imageData, options = {}) {
    const {
        edgeWeight = 0.3,
        intensityWeight = 0.7,
    } = options; // Removed blurPasses

    const w = imageData.width;
    const h = imageData.height;

    // 1. Extract grayscale data (assuming it's already grayscale from main thread)
    const gray = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) {
        gray[i] = imageData.data[i * 4]; // Read from the Red channel
    }

    // 2. Find edges from the *original* sharp image
    const edges = sobelMagnitude(gray, w, h); // Use gray, not blurred

    // 3. Combine edges and inverted intensity
    const target = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        const edgeValue = edgeWeight * edges[i];
        // Use the original (non-blurred) gray intensity
        const intensityValue = intensityWeight * (255 - gray[i]); // Inverted

        // Combine and create the "lightness" map
        target[i] = 255 - Math.min(255, edgeValue + intensityValue);
    }

    // Return the target map (where 0 is darkest, 255 is lightest)
    return target;
}
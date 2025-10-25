/**
 * Handles image loading and processing for the main thread (UI preview).
 */
export class ImageProcessor {

    /**
     * Loads an image file into an HTMLImageElement.
     */
    static loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Processes a loaded image for preview.
     */
    static processBase(img, size = 400, contrast = 1, brightness = 0) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // --- 1. Scale/crop image to "cover" the square canvas ---
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);

        // --- 2. Grayscale, Contrast, Brightness ---
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Brightness value from -1..1 to -255..255
        const brightnessFactor = brightness * 255;

        for (let i = 0; i < data.length; i += 4) {
            // Grayscale
            let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // UPDATED: Simpler contrast formula where 1.0 is neutral
            gray = (gray - 128) * contrast + 128;

            // Brightness
            gray += brightnessFactor;

            // Clamp
            gray = Math.max(0, Math.min(255, gray));

            data[i] = data[i + 1] = data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);

        // --- 3. Circular Mask ---
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        return canvas;
    }
}
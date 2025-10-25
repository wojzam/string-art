/**
 * Handles all drawing operations on the result canvas.
 */
export class Renderer {

    /**
     * Clears the canvas, setting it to a white background.
     * @param {HTMLCanvasElement} canvas - The canvas to clear.
     */
    static clear(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Draws the complete string art sequence.
     * @param {HTMLCanvasElement} canvas - The target canvas.
     * @param {Array} pins - Array of {x, y} pin coordinates.
     * @param {Array} sequence - Array of {from, to} line objects.
     */
    static draw(canvas, pins, sequence) {
        const ctx = canvas.getContext('2d');

        // Clear and set background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set line style
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.2; // Use a thin line for high detail
        ctx.globalAlpha = 0.1; // Use transparency for better blending

        ctx.beginPath();

        // Draw all lines in the sequence
        for (const line of sequence) {
            if (!pins[line.from] || !pins[line.to]) continue;

            const p1 = pins[line.from];
            const p2 = pins[line.to];

            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }

        ctx.stroke();

        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
}
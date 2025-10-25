/**
 * Generates pin coordinates in a circle.
 */
export class PinsGenerator {

    /**
     * Generates 'nPins' evenly spaced coordinates around a circle.
     * @param {number} cx - Center X.
     * @param {number} cy - Center Y.
     * @param {number} radius - Radius of the circle.
     * @param {number} nPins - Number of pins to generate.
     * @returns {Array} - An array of {x, y} objects.
     */
    static generate(cx, cy, radius, nPins) {
        const pins = [];
        const angleStep = (2 * Math.PI) / nPins;

        for (let i = 0; i < nPins; i++) {
            // Subtract PI/2 to start at the top (12 o'clock)
            const theta = angleStep * i - (Math.PI / 2);

            const x = cx + radius * Math.cos(theta);
            const y = cy + radius * Math.sin(theta);

            pins.push({ x: Math.round(x), y: Math.round(y) });
        }
        return pins;
    }
}
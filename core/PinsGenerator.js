export class PinsGenerator {
    static generate(cx, cy, radius, nPins) {
        const pins = [];
        for (let i = 0; i < nPins; i++) {
            const theta = 2 * Math.PI * i / nPins;
            const x = cx + radius * Math.cos(theta - Math.PI / 2);
            const y = cy + radius * Math.sin(theta - Math.PI / 2);
            pins.push({ x, y });
        }
        return pins;
    }
}

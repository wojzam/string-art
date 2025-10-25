/**
 * Handles exporting data to a TXT file.
 */
export class FileUtils {

    /**
     * Exports a string art sequence as a TXT file (simple pin index list).
     * @param {Array} sequence - Array of {from, to} line objects.
     * @param {string} filename - The desired name for the downloaded file.
     */
    static exportTXT(sequence, filename = 'string_art_sequence.txt') {
        if (sequence.length === 0) return;

        // Start with the first pin index
        const firstPin = sequence[0].from;

        const pinIndexes = [firstPin, ...sequence.map(s => s.to)];

        const body = pinIndexes.join('\n');

        const blob = new Blob([body], { type: 'text/plain;charset=utf-8;' });

        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        if (link.download !== undefined) { // Check for browser support
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
}
export class FileUtils {
    static exportCSV(lineSequence, filename = 'lines.csv') {
        let csv = "from,to\n";
        lineSequence.forEach(l => { csv += `${l.from},${l.to}\n` });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
}

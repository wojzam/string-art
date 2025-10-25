export class ImageProcessor {
    /**
     * Load image from file
     * @param {File} file
     * @returns {Promise<HTMLImageElement>}
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
     * Process image: grayscale, brightness, contrast, circular crop
     * @param {HTMLImageElement} img
     * @param {number} size
     * @param {number} contrast
     * @param {number} brightness
     * @returns {HTMLCanvasElement}
     */
    static process(img, size, contrast=1, brightness=0) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // resize image to fit canvas
        const scale = Math.min(size/img.width, size/img.height);
        const w = img.width*scale;
        const h = img.height*scale;
        ctx.drawImage(img, (size-w)/2, (size-h)/2, w, h);

        // get image data
        let imageData = ctx.getImageData(0,0,size,size);
        let data = imageData.data;

        // grayscale + brightness + contrast
        const factor = (259*(contrast*255 + 255)) / (255*(259 - contrast*255));
        for(let i=0;i<data.length;i+=4){
            let gray = 0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
            gray = factor*(gray-128) + 128 + brightness*255;
            gray = Math.min(255, Math.max(0, gray));
            data[i]=data[i+1]=data[i+2]=gray;
        }

        ctx.putImageData(imageData,0,0);

        // apply circular mask
        ctx.globalCompositeOperation='destination-in';
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, 2*Math.PI);
        ctx.fill();
        ctx.globalCompositeOperation='source-over';

        return canvas;
    }
}

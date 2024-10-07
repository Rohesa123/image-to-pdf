import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';

// Fungsi untuk mengonversi gambar menjadi PDF
export const convertImagesToPdf = async (imagesFolder, mangaUrl) => {
  return new Promise((resolve) => {
    const files = fs.readdirSync(imagesFolder);
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
      })
      .sort((a, b) => parseInt(a) - parseInt(b));
    const firstImageDimensions = sizeOf(path.join(imagesFolder, imageFiles[0])); 
    const doc = new PDFDocument({
      margins: { bottom: 0, left: 0, right: 0, top: 0 },
      size: [firstImageDimensions.width, firstImageDimensions.height],
      layout: firstImageDimensions.width > firstImageDimensions.height ? 'landscape' : 'portrait',
    });

    const folderName = path.basename(imagesFolder);
    const outputPdfPath = `./public/pdf/${mangaUrl.split('/')[mangaUrl.split('/').length - 2]}.pdf`;
    const output = fs.createWriteStream(outputPdfPath);

    doc.pipe(output);

    imageFiles.forEach((file, index) => {
      const imagePath = path.join(imagesFolder, file);
      const dimensions = sizeOf(imagePath);

      if (index !== 0) {
        doc.addPage({
          size: [dimensions.width, dimensions.height],
          layout: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
          margins: { bottom: 0, left: 0, right: 0, top: 0 },
        });
      } else {
        doc.page.width = dimensions.width;
        doc.page.height = dimensions.height;
        doc.page.layout = dimensions.width > dimensions.height ? 'landscape' : 'portrait';
      }

      doc.rect(0, 0, doc.page.width, doc.page.height).fill('white');
      
      doc.image(imagePath, {
        fit: [doc.page.width, doc.page.height],
        align: 'center',
        valign: 'center'
      });
    });

    doc.end();
    console.log(`Berhasil mengonversi ${imageFiles.length} gambar dari ${folderName} menjadi PDF di ${outputPdfPath}\n`);
    fs.rmSync(imagesFolder, { recursive: true, force: true });
    resolve();
  });
};

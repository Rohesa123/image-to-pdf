import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';

// Fungsi untuk mengonversi gambar menjadi PDF
export const convertImagesToPdf = async (imagesFolder, mangaUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const files = fs.readdirSync(imagesFolder);
      const imageFiles = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
        })
        .sort((a, b) => {
          // Extract numeric part from filenames like "image-0.jpg", "image-1.jpg"
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });
      
      if (imageFiles.length === 0) {
        reject(new Error('No image files found in the folder'));
        return;
      }
      
      const firstImageDimensions = sizeOf(path.join(imagesFolder, imageFiles[0])); 
      const doc = new PDFDocument({
        margins: { bottom: 0, left: 0, right: 0, top: 0 },
        size: [firstImageDimensions.width, firstImageDimensions.height],
        layout: firstImageDimensions.width > firstImageDimensions.height ? 'landscape' : 'portrait',
      });

      const folderName = path.basename(imagesFolder);
      const outputDir = './public/pdf';
      
      // Ensure output directory exists
      if (!fs.existsSync('./public')) {
        fs.mkdirSync('./public');
      }
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      const outputPdfPath = `${outputDir}/${mangaUrl.split('/')[mangaUrl.split('/').length - 2]}.pdf`;
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
      
      // Wait for the PDF to be fully written
      output.on('finish', () => {
        console.log(`Berhasil mengonversi ${imageFiles.length} gambar dari ${folderName} menjadi PDF di ${outputPdfPath}\n`);
        fs.rmSync(imagesFolder, { recursive: true, force: true });
        resolve();
      });
      
      output.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

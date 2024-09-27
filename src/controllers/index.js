const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Folder root yang berisi subfolder
const rootFolder = '../../public/folder';

// Fungsi untuk mengonversi gambar menjadi PDF
const convertImagesToPdf = (imagesFolder) => {
  const doc = new PDFDocument();

  // Nama folder sebagai nama PDF
  const folderName = path.basename(imagesFolder);

  // Path untuk file PDF output
  const outputPdfPath = `../../public/pdf/${folderName}.pdf`;
  const output = fs.createWriteStream(outputPdfPath);

  // Menghubungkan stream ke PDF
  doc.pipe(output);

  // Membaca file gambar di folder secara berurutan
  fs.readdir(imagesFolder, (err, files) => {
    if (err) {
      console.error(`Gagal membaca folder ${imagesFolder}:`, err);
      return;
    }

    // Filter hanya file JPG, JPEG, PNG dan urutkan
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
      })
      .sort((a, b) => parseInt(a) - parseInt(b));

    // Menambahkan gambar ke PDF
    imageFiles.forEach((file, index) => {
      const imagePath = path.join(imagesFolder, file);
      
      // Menambahkan halaman baru setelah halaman pertama
      if (index !== 0) {
        doc.addPage();
      }
      
      // Menambahkan gambar ke halaman
      doc.image(imagePath, {
        fit: [500, 750], // Mengatur ukuran gambar agar sesuai dengan halaman
        align: 'center',
        valign: 'center'
      });
    });

    // Selesai menulis ke PDF
    doc.end();

    console.log(`Berhasil mengonversi ${imageFiles.length} gambar dari ${folderName} menjadi PDF di ${outputPdfPath}`);
  });
};

// Membaca semua subfolder dari folder root
fs.readdir(rootFolder, (err, folders) => {
  if (err) {
    console.error('Gagal membaca folder root:', err);
    return;
  }

  // Filter hanya direktori (subfolder)
  folders.forEach(folder => {
    const folderPath = path.join(rootFolder, folder);

    // Periksa apakah folderPath adalah direktori
    fs.stat(folderPath, (err, stats) => {
      if (err) {
        console.error(`Gagal memeriksa folder ${folderPath}:`, err);
        return;
      }

      if (stats.isDirectory()) {
        // Jika subfolder, panggil fungsi untuk konversi gambar ke PDF
        convertImagesToPdf(folderPath);
      }
    });
  });
});

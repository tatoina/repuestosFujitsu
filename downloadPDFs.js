/**
 * Script para descargar PDFs desde Google Drive
 * Uso: node downloadPDFs.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// URL de la carpeta compartida de Google Drive
const DRIVE_FOLDER_ID = '1tvnu4v7gm9IT8Kk-bNDJ6WEPVtL_KLyt';

// Directorio de salida
const OUTPUT_DIR = path.join(__dirname, 'data', 'pdfs');

console.log('🔍 Accediendo a Google Drive...');
console.log('📂 Carpeta ID:', DRIVE_FOLDER_ID);
console.log('💾 Descargando a:', OUTPUT_DIR);

// Asegurar que existe el directorio
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Función para descargar archivo desde Google Drive
function downloadFile(fileId, fileName) {
    return new Promise((resolve, reject) => {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const filePath = path.join(OUTPUT_DIR, fileName);
        const file = fs.createWriteStream(filePath);

        console.log(`⬇️  Descargando: ${fileName}...`);

        https.get(downloadUrl, (response) => {
            // Manejar redirecciones
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✅ Descargado: ${fileName}`);
                        resolve(filePath);
                    });
                }).on('error', (err) => {
                    fs.unlink(filePath, () => {});
                    reject(err);
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Descargado: ${fileName}`);
                    resolve(filePath);
                });
            }
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

console.log('\n⚠️  NOTA: Para descargar los PDFs automáticamente, necesito usar la API de Google Drive.');
console.log('📋 Alternativa más simple:');
console.log('   1. Ve a: https://drive.google.com/drive/folders/1tvnu4v7gm9IT8Kk-bNDJ6WEPVtL_KLyt');
console.log('   2. Selecciona todos los PDFs');
console.log('   3. Click derecho → Descargar');
console.log(`   4. Mueve los archivos descargados a: ${OUTPUT_DIR}`);
console.log('\n💡 Una vez que tengas los PDFs en la carpeta, ejecuta: node processPDFs.js\n');

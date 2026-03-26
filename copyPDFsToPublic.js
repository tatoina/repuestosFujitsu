/**
 * Script para copiar PDFs a la carpeta public
 * Esto permite que la aplicación web pueda abrir los PDFs directamente
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, 'data', 'pdfs');
const TARGET_DIR = path.join(__dirname, 'public', 'pdfs');

console.log('📄 Copiando PDFs a carpeta pública...\n');

// Crear directorio de destino si no existe
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`✅ Creado directorio: ${TARGET_DIR}`);
}

// Verificar que existe el directorio de origen
if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Error: No existe el directorio ${SOURCE_DIR}`);
    console.log('   Asegúrate de tener PDFs en la carpeta data/pdfs/');
    process.exit(1);
}

// Copiar todos los PDFs
let copiedCount = 0;
let skippedCount = 0;

try {
    const files = fs.readdirSync(SOURCE_DIR);
    
    // Filtrar solo archivos PDF
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    console.log(`📁 Encontrados ${pdfFiles.length} archivos PDF en ${SOURCE_DIR}\n`);
    
    for (const file of pdfFiles) {
        const sourcePath = path.join(SOURCE_DIR, file);
        const targetPath = path.join(TARGET_DIR, file);
        
        // Verificar si el archivo ya existe y tiene el mismo tamaño
        if (fs.existsSync(targetPath)) {
            const sourceStats = fs.statSync(sourcePath);
            const targetStats = fs.statSync(targetPath);
            
            if (sourceStats.size === targetStats.size) {
                skippedCount++;
                continue;
            }
        }
        
        // Copiar archivo
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
        console.log(`   📄 Copiado: ${file}`);
    }
    
    console.log('\n✅ Copia completada!');
    console.log(`   📄 PDFs copiados: ${copiedCount}`);
    console.log(`   ⏭️  PDFs omitidos (ya existían): ${skippedCount}`);
    console.log(`   📁 Destino: ${TARGET_DIR}\n`);
    
    if (copiedCount > 0) {
        console.log('🎉 Los PDFs ahora están disponibles en la aplicación web!\n');
        console.log('💡 Los usuarios podrán hacer clic en "Abrir PDF" para ver el catálogo completo.\n');
    }
    
} catch (error) {
    console.error('❌ Error copiando PDFs:', error.message);
    process.exit(1);
}

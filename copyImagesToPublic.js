/**
 * Script para copiar imágenes extraídas a la carpeta public
 * Esto permite que la aplicación web pueda acceder a ellas
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, 'data', 'images');
const TARGET_DIR = path.join(__dirname, 'public', 'images');

console.log('📸 Copiando imágenes a carpeta pública...\n');

// Crear directorio de destino si no existe
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`✅ Creado directorio: ${TARGET_DIR}`);
}

// Verificar que existe el directorio de origen
if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Error: No existe el directorio ${SOURCE_DIR}`);
    console.log('   Primero ejecuta extractImages.py para extraer las imágenes de los PDFs');
    process.exit(1);
}

// Copiar todas las imágenes
let copiedCount = 0;
let skippedCount = 0;

try {
    const files = fs.readdirSync(SOURCE_DIR);
    
    // Filtrar solo archivos de imagen
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    console.log(`📁 Encontrados ${imageFiles.length} archivos de imagen en ${SOURCE_DIR}\n`);
    
    for (const file of imageFiles) {
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
        
        if (copiedCount % 10 === 0) {
            console.log(`   Copiados ${copiedCount} archivos...`);
        }
    }
    
    console.log('\n✅ Copia completada!');
    console.log(`   📸 Imágenes copiadas: ${copiedCount}`);
    console.log(`   ⏭️  Imágenes omitidas (ya existían): ${skippedCount}`);
    console.log(`   📁 Destino: ${TARGET_DIR}\n`);
    
    if (copiedCount > 0) {
        console.log('🎉 Las imágenes ahora están disponibles en la aplicación web!\n');
    }
    
} catch (error) {
    console.error('❌ Error copiando imágenes:', error.message);
    process.exit(1);
}

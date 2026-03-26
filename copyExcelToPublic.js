/**
 * Script para copiar el archivo Excel a la carpeta public
 * Esto permite que la aplicación web pueda abrir el Excel directamente
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, 'data', 'repuestos.xlsx');
const TARGET_FILE = path.join(__dirname, 'public', 'repuestos.xlsx');

console.log('📊 Copiando archivo Excel a carpeta pública...\n');

// Crear directorio público si no existe
const publicDir = path.dirname(TARGET_FILE);
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log(`✅ Creado directorio: ${publicDir}`);
}

// Verificar que existe el archivo de origen
if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Error: No existe el archivo ${SOURCE_FILE}`);
    console.log('   Asegúrate de tener el archivo repuestos.xlsx en data/');
    process.exit(1);
}

try {
    // Verificar si el archivo ya existe y tiene el mismo tamaño
    let needsCopy = true;
    if (fs.existsSync(TARGET_FILE)) {
        const sourceStats = fs.statSync(SOURCE_FILE);
        const targetStats = fs.statSync(TARGET_FILE);
        
        if (sourceStats.size === targetStats.size) {
            needsCopy = false;
            console.log('⏭️  El archivo ya existe y está actualizado');
        }
    }
    
    if (needsCopy) {
        // Copiar archivo
        fs.copyFileSync(SOURCE_FILE, TARGET_FILE);
        console.log('✅ Archivo Excel copiado!');
    }
    
    console.log(`   📊 Archivo: repuestos.xlsx`);
    console.log(`   📁 Destino: ${TARGET_FILE}\n`);
    console.log('🎉 El archivo Excel ahora está disponible en la aplicación web!\n');
    console.log('💡 Los usuarios podrán hacer clic en "Abrir Excel" para ver el archivo completo.\n');
    
} catch (error) {
    console.error('❌ Error copiando archivo Excel:', error.message);
    process.exit(1);
}

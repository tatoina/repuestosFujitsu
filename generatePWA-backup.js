// Script mejorado para generar iconos PWA
const fs = require('fs');
const path = require('path');

// Crear iconos básicos sin dependencias externas
function createBasicPNGIcons() {
  const publicDir = path.join(__dirname, 'public');
  
  // Asegurar que el directorio public existe
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Crear un PNG básico de 1x1 pixel (icono púrpura simple)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVHic7doxAQAAAMKg9U9tDQ+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBPAAEtvxcjAAAAAElFTkSuQmCC';

  // Escribir iconos
  const icon192Path = path.join(publicDir, 'icon-192x192.png');
  const icon512Path = path.join(publicDir, 'icon-512x512.png');
  
  fs.writeFileSync(icon192Path, Buffer.from(pngBase64, 'base64'));
  fs.writeFileSync(icon512Path, Buffer.from(pngBase64, 'base64'));
  
  console.log('✅ Iconos PNG básicos creados');
  
  // También crear favicon
  const faviconPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(faviconPath, Buffer.from(pngBase64, 'base64'));
  
  console.log('✅ Favicon creado');
}

// Actualizar manifest para usar PNG
function updateManifestForPNG() {
  const manifestPath = path.join(__dirname, 'public', 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Actualizar iconos para usar PNG
    manifest.icons = [
      {
        "src": "/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable any"
      }
    ];
    
    // Actualizar atajos
    manifest.shortcuts.forEach(shortcut => {
      shortcut.icons = [
        {
          "src": "/icon-192x192.png",
          "sizes": "192x192"
        }
      ];
    });
    
    // Remover screenshots por ahora
    delete manifest.screenshots;
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Manifest actualizado para PNG');
  }
}

// Verificar manifest.json
function verifyManifest() {
  const manifestPath = path.join(__dirname, 'public', 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log('✅ Manifest.json válido');
      console.log(`   - Nombre: ${manifest.name}`);
      console.log(`   - Iconos: ${manifest.icons.length}`);
      console.log(`   - Atajos: ${manifest.shortcuts.length}`);
    } catch (error) {
      console.error('❌ Error en manifest.json:', error.message);
    }
  } else {
    console.error('❌ manifest.json no encontrado');
  }
}

// Copiar archivos a dist si existe
function copyToDistIfExists() {
  const distDir = path.join(__dirname, 'dist');
  const publicDir = path.join(__dirname, 'public');
  
  if (fs.existsSync(distDir)) {
    console.log('📁 Copiando archivos públicos a dist...');
    const publicFiles = ['manifest.json', 'sw.js', 'browserconfig.xml', 'icon-192x192.png', 'icon-512x512.png', 'favicon.ico'];
    
    publicFiles.forEach(file => {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`   ✅ ${file} copiado`);
      }
    });
  }
}

// Ejecutar
console.log('🚀 Generando archivos PWA mejorados...');
createBasicPNGIcons();
updateManifestForPNG();
verifyManifest();
copyToDistIfExists();
console.log('✅ Archivos PWA generados exitosamente!');
console.log('📱 Tu app ahora es una PWA instalable con iconos PNG');
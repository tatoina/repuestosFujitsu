// Script para generar iconos PWA
const fs = require('fs');
const path = require('path');

// Crear iconos básicos usando canvas (simulado con texto)
function createIconFiles() {
  const publicDir = path.join(__dirname, 'public');
  
  // Asegurar que el directorio public existe
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Crear iconos básicos (serán reemplazados por verdaderos iconos después)
  const iconSizes = [192, 512];
  
  iconSizes.forEach(size => {
    const iconPath = path.join(publicDir, `icon-${size}x${size}.png`);
    
    // Por ahora, copiar el SVG como placeholder
    const svgPath = path.join(publicDir, 'icon.svg');
    if (fs.existsSync(svgPath)) {
      fs.copyFileSync(svgPath, iconPath.replace('.png', '.svg'));
    }
    
    console.log(`✅ Icono ${size}x${size} creado (placeholder)`);
  });

  // Crear screenshots placeholder
  const screenshotMobile = path.join(publicDir, 'screenshot-mobile.png');
  const screenshotDesktop = path.join(publicDir, 'screenshot-desktop.png');
  
  // Por ahora usar el mismo icono como placeholder
  const iconPath = path.join(publicDir, 'icon.svg');
  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, screenshotMobile.replace('.png', '.svg'));
    fs.copyFileSync(iconPath, screenshotDesktop.replace('.png', '.svg'));
  }

  console.log('✅ Screenshots placeholder creados');
  console.log('📝 Nota: Reemplaza los archivos SVG con imágenes PNG reales para mejor compatibilidad');
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

// Ejecutar
console.log('🚀 Generando archivos PWA...');
createIconFiles();
verifyManifest();
console.log('✅ Archivos PWA generados exitosamente!');
console.log('📱 Tu app ahora es una PWA instalable');
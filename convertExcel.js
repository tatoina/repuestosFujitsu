// Script para convertir Excel a JSON
// Ejecutar con: node convertExcel.js

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertExcelToJSON() {
  try {
    // Leer el archivo Excel
    const excelPath = path.join(__dirname, 'data', 'repuestos.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('❌ No se encontró el archivo repuestos.xlsx en la carpeta /data/');
      console.log('📁 Asegúrate de que el archivo esté en: SparePartsApp/data/repuestos.xlsx');
      return;
    }

    console.log('📖 Leyendo archivo Excel...');
    const workbook = XLSX.readFile(excelPath);
    
    // Tomar la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Encontradas ${jsonData.length} filas en el Excel`);
    console.log('📋 Primeras 3 filas:');
    console.log(jsonData.slice(0, 3));

    // Detectar columnas automáticamente
    if (jsonData.length === 0) {
      console.error('❌ El archivo Excel está vacío');
      return;
    }

    const keys = Object.keys(jsonData[0]);
    console.log('🔍 Columnas detectadas:', keys);

    // Buscar columnas de código y descripción
    const codeColumn = keys.find(key => 
      key.toLowerCase().includes('cod') || 
      key.toLowerCase().includes('code') ||
      keys.indexOf(key) === 0
    ) || keys[0];

    const descColumn = keys.find(key => 
      key.toLowerCase().includes('desc') || 
      key.toLowerCase().includes('description') ||
      key.toLowerCase().includes('nombre') ||
      (keys.indexOf(key) === 1 && !key.toLowerCase().includes('cod'))
    ) || keys[1];

    console.log(`📊 Columna de código: "${codeColumn}"`);
    console.log(`📋 Columna de descripción: "${descColumn}"`);

    // Convertir a formato estándar
    const convertedData = jsonData.map((row, index) => {
      const code = String(row[codeColumn] || '').trim();
      const description = String(row[descColumn] || '').trim();
      
      return {
        id: index + 1,
        code: code,
        description: description,
        originalData: row
      };
    }).filter(item => item.code && item.description); // Filtrar filas vacías

    console.log(`✅ Convertidos ${convertedData.length} repuestos válidos`);

    // Guardar como JSON
    const outputPath = path.join(__dirname, 'src', 'data', 'repuestos.json');
    
    // Crear directorio si no existe
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));
    
    console.log('✅ Archivo JSON creado exitosamente en:', outputPath);
    console.log('🎉 Ahora la app usará tus datos reales!');
    
    // Mostrar algunos ejemplos
    console.log('\n📝 Algunos ejemplos de tus datos:');
    convertedData.slice(0, 5).forEach(item => {
      console.log(`  ${item.code} → ${item.description}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

convertExcelToJSON();
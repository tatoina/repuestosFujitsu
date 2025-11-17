/**
 * Script mejorado para procesar PDFs de repuestos
 * Extrae texto y estructura los datos
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const PDFS_DIR = path.join(__dirname, 'data', 'pdfs');
const OUTPUT_FILE = path.join(__dirname, 'data', 'processed', 'pdfs-data.json');

console.log('🔧 Iniciando procesamiento de PDFs...\n');

// Crear directorios si no existen
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

async function processPDF(pdfPath, pdfName) {
    console.log(`📄 Procesando: ${pdfName}`);
    
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        
        // Procesar PDF
        const data = await pdf(dataBuffer);
        
        console.log(`   📊 Páginas: ${data.numpages}`);
        console.log(`   📝 Texto extraído: ${data.text.length} caracteres`);
        
        // Extraer líneas del texto
        const lines = data.text.split('\n').filter(line => line.trim().length > 0);
        
        const parts = [];
        
        // Buscar patrones de código/descripción
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detectar líneas que parecen contener códigos de repuestos
            // Patrón flexible: números, letras, guiones al inicio
            const codeMatch = line.match(/^([A-Z0-9][\w\-\.\/]{2,})\s+(.+)/);
            
            if (codeMatch && codeMatch[2].length > 10) {
                const code = codeMatch[1];
                let description = codeMatch[2];
                
                // Buscar número de referencia de imagen en la descripción o líneas siguientes
                let imageRef = null;
                const imgPattern = /(?:Fig\.|Figura|Ref\.|N[ºo]\.?)\s*(\d+)/i;
                const imgMatch = description.match(imgPattern);
                
                if (imgMatch) {
                    imageRef = imgMatch[1];
                } else if (i < lines.length - 1) {
                    // Buscar en la siguiente línea
                    const nextLineMatch = lines[i + 1].match(imgPattern);
                    if (nextLineMatch) {
                        imageRef = nextLineMatch[1];
                    }
                }
                
                parts.push({
                    code: code,
                    description: description.substring(0, 200), // Limitar longitud
                    imageRef: imageRef,
                    source: pdfName,
                    rawLine: line.substring(0, 150)
                });
            }
        }
        
        console.log(`   ✅ Encontrados ${parts.length} posibles repuestos`);
        
        return { parts, rawText: data.text.substring(0, 5000) }; // Guardar muestra del texto
        
    } catch (error) {
        console.error(`   ❌ Error procesando ${pdfName}:`, error.message);
        return { parts: [], rawText: '' };
    }
}

async function main() {
    // Verificar que existe el directorio de PDFs
    if (!fs.existsSync(PDFS_DIR)) {
        console.error(`❌ Error: No existe el directorio ${PDFS_DIR}`);
        return;
    }
    
    // Listar PDFs en el directorio
    const files = fs.readdirSync(PDFS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    
    if (files.length === 0) {
        console.error(`❌ No se encontraron archivos PDF en ${PDFS_DIR}`);
        return;
    }
    
    console.log(`📚 Encontrados ${files.length} archivos PDF:\n`);
    files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
    console.log('');
    
    // Procesar cada PDF
    const allParts = [];
    const pdfDetails = {};
    
    for (const file of files) {
        const pdfPath = path.join(PDFS_DIR, file);
        const result = await processPDF(pdfPath, file);
        
        allParts.push(...result.parts);
        pdfDetails[file] = {
            partsCount: result.parts.length,
            textSample: result.rawText
        };
        
        console.log('');
    }
    
    // Guardar resultado
    const output = {
        processedDate: new Date().toISOString(),
        totalParts: allParts.length,
        totalPDFs: files.length,
        parts: allParts,
        pdfDetails: pdfDetails
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    
    console.log('✅ Procesamiento completado!');
    console.log(`📊 Total de repuestos encontrados: ${allParts.length}`);
    console.log(`💾 Datos guardados en: ${OUTPUT_FILE}\n`);
    
    // Mostrar muestra de datos
    if (allParts.length > 0) {
        console.log('📋 Muestra de datos extraídos:\n');
        allParts.slice(0, 10).forEach((part, i) => {
            console.log(`${i + 1}. Código: ${part.code}`);
            console.log(`   Descripción: ${part.description.substring(0, 60)}...`);
            console.log(`   Imagen Ref: ${part.imageRef || 'N/A'}`);
            console.log(`   Fuente: ${part.source}\n`);
        });
    }
    
    console.log('\n🔍 Revisa el archivo JSON para ver todos los datos extraídos');
    console.log('✨ Siguiente paso: Integrar estos datos en la app de búsqueda\n');
}

main().catch(console.error);

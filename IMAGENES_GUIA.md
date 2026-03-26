# 📸 Guía de Imágenes en RepuestosFuji

Esta guía explica cómo trabajar con imágenes de repuestos extraídas de PDFs.

## 🎯 Funcionalidad

Cuando buscas un repuesto proveniente de un PDF, verás:
- **Número de referencia**: El número (1, 2, 3, 4...) que aparece delante del código en el PDF
- **Botón "Ver Imagen"**: Para ver la foto del repuesto
- **Información de la página**: En qué página del PDF está el repuesto

## 📋 Formato de los PDFs

Los PDFs deben tener este formato:

```
[Imagen 1]
[Imagen 2]
[Imagen 3]

1 0800531794 CONTROLADOR TALLADEGA
2 0800341056 PLACA BASE INTEL Q965 LGA 775 EATX
3 0800387462 PROCESADOR INTEL CORE 2 DUO E6400
```

El número al inicio (1, 2, 3...) indica qué imagen de arriba corresponde a ese repuesto.

## 🔧 Proceso completo de configuración

### Paso 1: Extraer imágenes de los PDFs

Primero, coloca tus archivos PDF en la carpeta `data/pdfs/`

```bash
# Ejecutar el script de extracción de imágenes (Python)
python extractImages.py
```

Esto creará:
- `data/images/` - Carpeta con todas las imágenes extraídas
- `data/processed/images-mapping.json` - Mapeo de imágenes por PDF

### Paso 2: Procesar el texto de los PDFs

Esto extrae los códigos, descripciones y referencias a imágenes:

```bash
# Ejecutar el script de procesamiento de PDFs (Node.js)
node processPDFs.js
```

Esto creará o actualizará:
- `data/processed/pdfs-data.json` - Base de datos de repuestos de PDFs

El script ahora detecta:
- ✅ Formato con número de referencia: `1 0800531794 CONTROLADOR TALLADEGA`
- ✅ Formato antiguo: `0800531794 CONTROLADOR TALLADEGA`
- ✅ Referencias a imágenes en texto: `Fig. 5`, `Ref. 3`, etc.

### Paso 3: Copiar imágenes a la carpeta pública

Para que las imágenes sean accesibles en la aplicación web:

```bash
# Copiar imágenes de data/images/ a public/images/
node copyImagesToPublic.js
```

### Paso 4: Copiar JSONs a src/data/processed/

Los archivos JSON procesados deben estar disponibles para la aplicación:

```bash
# En Windows PowerShell
Copy-Item data\processed\*.json src\data\processed\ -Force

# En Linux/Mac
cp data/processed/*.json src/data/processed/
```

### Paso 5: Verificar y ejecutar la app

```bash
# Ejecutar la aplicación
npm start

# O en modo web
npm run web
```

## 📁 Estructura de archivos

```
RepuestosFuji/
├── data/
│   ├── pdfs/                           # PDFs originales
│   │   ├── CONTROLADOR.pdf
│   │   └── ...
│   ├── images/                         # Imágenes extraídas
│   │   ├── CONTROLADOR_page1_img1.jpeg
│   │   ├── CONTROLADOR_page2_img1.jpeg
│   │   └── ...
│   └── processed/
│       ├── images-mapping.json         # Mapeo de imágenes
│       └── pdfs-data.json             # Datos procesados de PDFs
│
├── public/
│   └── images/                         # Imágenes accesibles en web
│       ├── CONTROLADOR_page1_img1.jpeg
│       └── ...
│
├── src/
│   └── data/
│       └── processed/                  # Copias para la app
│           ├── images-mapping.json
│           └── pdfs-data.json
│
├── extractImages.py                    # Script Python para extraer imágenes
├── processPDFs.js                     # Script Node.js para procesar texto
└── copyImagesToPublic.js              # Script para copiar imágenes
```

## 🎨 Cómo se muestran en la interfaz

Cuando buscas un repuesto que tiene imagen:

1. **Chip de indicador**: Aparece un chip verde con 📷 "Tiene foto (#N)"
2. **Botón "Ver Imagen"**: Botón verde para abrir la imagen en un modal
3. **Información detallada**: PDF origen, página y número de imagen

Si la imagen no está disponible:
- Aparece un botón naranja "Info (#N)"
- Al presionarlo, muestra instrucciones de qué hacer

## 🔍 Detección de referencias a imágenes

El script `processPDFs.js` ahora detecta múltiples formatos:

### Formato 1: Número al inicio (NUEVO)
```
1 0800531794 CONTROLADOR TALLADEGA
2 0800341056 PLACA BASE INTEL Q965
```
El número `1` o `2` se captura como `imageRef`

### Formato 2: Texto con referencias
```
0800531794 Ver Fig. 3
0800341056 Consultar Figura 5
```
Se buscan patrones: `Fig.`, `Figura`, `Ref.`, `Nº`

### Formato 3: Línea siguiente
Si la descripción no tiene referencia, se busca en la línea siguiente.

## ⚙️ Configuración avanzada

### Cambiar el patrón de detección

Edita `processPDFs.js`, línea ~38:

```javascript
// Detectar formato: "1 CODIGO DESCRIPCION"
const patternWithImageRef = line.match(/^(\d+)\s+([A-Z0-9][\w\-\.\/]{2,})\s+(.+)/);
```

### Ajustar mapeo de imágenes

Edita `src/services/searchServiceUnified.js`, línea ~110:

```javascript
// Buscar imagen basándose en página e índice
const pageImages = pdfImages.filter(img => img.page === item.page);
const imageIndex = parseInt(item.imageRef);
```

## 🐛 Solución de problemas

### Las imágenes no se muestran

1. ✅ Verifica que existan en `public/images/`
2. ✅ Ejecuta `node copyImagesToPublic.js`
3. ✅ Reinicia el servidor de desarrollo
4. ✅ Abre DevTools y revisa errores en la consola

### No se detectan las referencias a imágenes

1. ✅ Revisa el formato de tu PDF
2. ✅ Ejecuta `node processPDFs.js` de nuevo
3. ✅ Verifica `data/processed/pdfs-data.json`:
   - Busca un repuesto
   - Verifica que `imageRef` no sea `null`
   - Verifica que `page` tenga un valor

### La imagen no coincide con el repuesto

1. ✅ Revisa `data/processed/images-mapping.json`
2. ✅ Verifica que las imágenes estén organizadas por página
3. ✅ El número de referencia debe coincidir con el índice de la imagen en esa página

Ejemplo:
```json
{
  "page": 2,
  "index": 1  // Primera imagen de la página 2
}
```

Si el repuesto tiene `imageRef: "1"` y `page: 2`, buscará la primera imagen de la página 2.

## 🚀 Script completo automatizado

Puedes crear un script en `package.json` para ejecutar todo de una vez:

```json
{
  "scripts": {
    "process-pdfs": "python extractImages.py && node processPDFs.js && node copyImagesToPublic.js && xcopy data\\processed\\*.json src\\data\\processed\\ /Y"
  }
}
```

Luego simplemente ejecuta:
```bash
npm run process-pdfs
```

## 📝 Notas importantes

- **Python**: Se requiere Python con PyMuPDF (`pip install PyMuPDF`)
- **Node.js**: Se requiere `pdf-parse` (`npm install pdf-parse`)
- **Tamaño**: Las imágenes se copian dos veces (data/ y public/), considera el espacio
- **Performance**: Muchas imágenes pueden aumentar el tiempo de carga inicial
- **Cache**: Las imágenes se cachean en el navegador para mejorar el rendimiento

## ✅ Checklist de verificación

Antes de desplegar a producción:

- [ ] Ejecutado `python extractImages.py`
- [ ] Ejecutado `node processPDFs.js`
- [ ] Ejecutado `node copyImagesToPublic.js`
- [ ] Copiado JSONs a `src/data/processed/`
- [ ] Verificado que `imageRef` no sea `null` en varios repuestos
- [ ] Probado búsqueda de repuestos con imágenes
- [ ] Verificado que las imágenes se muestren correctamente
- [ ] Comprobado en diferentes navegadores/dispositivos

---

**¡Ahora tus repuestos tendrán imágenes! 📸**

# 🔧 Guía del Panel de Administración - RepuestosFuji v2.1

## 📋 Descripción

El panel de administración permite cargar múltiples archivos (Excel y PDF) para actualizar la base de datos de repuestos automáticamente.

---

## 🔐 Acceso al Panel

1. Click en el **botón de configuración** (⚙️) en la esquina superior derecha
2. Ingresa la contraseña: **`fujitsu`**
3. Accederás al panel de carga de archivos

---

## 📤 Cargar Archivos

### Tipos de archivos soportados:

#### 📊 Excel (.xlsx, .xls)
- Debe contener columnas de **código** y **descripción**
- El sistema detecta automáticamente las columnas correctas
- Busca columnas con nombres como: "cod", "code", "desc", "description", "nombre"

**Ejemplo de estructura Excel:**
```
Código      | Descripción
------------|------------------
ABC123      | Cable HDMI 2m
XYZ789      | Conector USB-C
```

#### 📄 PDF con imágenes
- Debe contener códigos de repuestos en el texto
- Las imágenes se extraen automáticamente usando PyMuPDF
- El sistema busca patrones de código como: `ABC123 Descripción del producto`

---

## 🎯 Proceso de Carga

1. **Seleccionar archivos**
   - Click en "Seleccionar archivos"
   - Puedes seleccionar múltiples archivos a la vez (Ctrl + Click)
   - Acepta archivos Excel (.xlsx, .xls) y PDF (.pdf)

2. **Revisar lista**
   - Los archivos seleccionados aparecen en una lista
   - Muestra: nombre del archivo, tipo (Excel/PDF), y tamaño
   - Puedes eliminar archivos con el botón ❌

3. **Procesar**
   - Click en "Procesar X archivo(s)"
   - El sistema procesa cada archivo automáticamente:
     - **Excel**: Extrae códigos y descripciones
     - **PDF**: Extrae códigos, descripciones e imágenes
   
4. **Resultado**
   - Muestra estadísticas de procesamiento:
     - 📊 Repuestos Excel: cantidad
     - 📄 Repuestos PDFs: cantidad  
     - 🖼️ Imágenes extraídas: cantidad
     - Total de repuestos añadidos

5. **Actualización**
   - Los datos se guardan en **localStorage** del navegador
   - La página se recarga automáticamente
   - Los nuevos repuestos aparecen en la búsqueda inmediatamente

---

## 🔍 Cómo Funciona

### Procesamiento Excel:
```javascript
1. Lee el archivo Excel
2. Detecta columnas de código y descripción
3. Convierte cada fila a formato estándar
4. Guarda en localStorage ('excelData')
5. Se fusiona con datos existentes al buscar
```

### Procesamiento PDF:
```javascript
1. Usa PDF.js para leer el PDF
2. Extrae texto de cada página
3. Busca patrones de código (ej: "ABC123 Descripción")
4. Cuenta imágenes en cada página
5. Guarda códigos en localStorage ('pdfData')
6. Las imágenes quedan vinculadas por número de página
```

---

## 💾 Persistencia de Datos

Los datos cargados se guardan en el navegador usando **localStorage**:
- ✅ Persisten entre sesiones
- ✅ No requieren servidor
- ✅ Disponibles offline (PWA)
- ⚠️ Se borran si limpias datos del navegador
- ⚠️ Son locales a cada dispositivo/navegador

### Claves de localStorage:
- `excelData`: Array con repuestos de Excel subidos
- `pdfData`: Array con repuestos de PDFs subidos

---

## 🖼️ Visualización de Imágenes

Cuando los repuestos tienen imágenes:
- Aparece chip verde: **"📷 Tiene foto (#N)"**
- Botón **"Ver Imagen"** (si la imagen está disponible)
- Click abre modal con:
  - Código y descripción del repuesto
  - Imagen en pantalla completa
  - Información del PDF fuente

---

## 🚀 Ejemplo Completo

### Escenario: Cargar catálogo de repuestos

1. Preparar archivos:
   - `repuestos_2024.xlsx` - Lista de códigos y descripciones
   - `catalogo_motores.pdf` - Catálogo con fotos
   - `catalogo_electronicos.pdf` - Otro catálogo

2. En el panel:
   - Seleccionar los 3 archivos
   - Verificar que aparecen en la lista
   - Click "Procesar 3 archivo(s)"

3. Resultado esperado:
   ```
   ✅ Archivos procesados:
   
   📊 Repuestos Excel: 150
   📄 Repuestos PDFs: 89
   🖼️ Imágenes extraídas: 45
   
   Total: 239 repuestos
   ```

4. La app se recarga y ahora puedes buscar los 239 nuevos repuestos

---

## ⚠️ Limitaciones y Consejos

### Limitaciones:
- Las imágenes de PDFs solo se vinculan por número de página
- El patrón de código debe ser: `CODIGO Descripción` (código al inicio)
- localStorage tiene límite de ~5-10MB (varía por navegador)
- Los datos son locales al navegador

### Consejos:
- ✅ Usa archivos Excel para listas grandes sin imágenes
- ✅ Usa PDFs para catálogos con fotos
- ✅ Mantén formato consistente en tus archivos
- ✅ Prueba con un archivo pequeño primero
- ✅ Haz backup de tus archivos originales

---

## 🛠️ Solución de Problemas

### "No se pudieron procesar los archivos"
- Verifica que el Excel tenga columnas de código y descripción
- Revisa que el PDF tenga texto (no solo imágenes escaneadas)

### "Las imágenes no aparecen"
- Las imágenes se extraen pero se vinculan por página
- Verifica que el número de imagen corresponda

### "Los datos no persisten"
- Comprueba que localStorage no esté deshabilitado
- Verifica que no estés en modo incógnito
- Revisa el espacio disponible en localStorage

---

## 📞 Soporte

Para problemas o dudas, revisa la consola del navegador (F12) donde aparecen logs detallados del procesamiento.

---

**Versión:** 2.1.0  
**Última actualización:** 17 Nov 2025

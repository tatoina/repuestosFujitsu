# RepuestosFuji 🔧

Una aplicación móvil React Native para búsqueda bidireccional de códigos y descripciones de repuestos. Desarrollada para optimizar la gestión de inventario con búsqueda en tiempo real y panel de administración integrado.

## 🌟 Demo en vivo

**🔗 [Abrir aplicación](https://repuestosfuji.vercel.app)**

## 🚀 Características principales

- ✅ **Búsqueda bidireccional**: Código → Descripción o Descripción → Código
- ✅ **Búsqueda en tiempo real**: Resultados instantáneos mientras escribes
- ✅ **Búsqueda en PDFs**: Busca en PDFs y en archivos Excel simultáneamente
- ✅ **Gestión de fuentes**: Activa/desactiva fuentes de datos para búsquedas más precisas
- ✅ **Abrir documentos**: Botones para abrir PDFs y Excel originales con un clic
- ✅ **Panel de administración**: Actualizar y gestionar base de datos con contraseña
- ✅ **Procesamiento Excel**: Carga automática de archivos .xlsx/.xls
- ✅ **Responsive**: Optimizado para móvil y escritorio
- ✅ **Auto-detección**: Reconoce automáticamente columnas de código/descripción
- ✅ **Interfaz moderna**: Material Design con React Native Paper

## 📱 Cómo usar

### Para usuarios finales:
1. **Buscar por descripción**: Escribe parte de la descripción para obtener el código
2. **Buscar por código**: Cambia el modo y busca por código para obtener la descripción
3. **Copiar resultados**: Toca "Copiar" en cualquier resultado
4. **Ver documentos originales**: 
   - Si el repuesto viene de un **PDF**, haz clic en **"Abrir PDF"** (naranja) para ver el catálogo completo
   - Si el repuesto viene de **Excel**, haz clic en **"Abrir Excel"** (verde) para ver la hoja de cálculo completa

### Para administradores:
1. **Acceder al panel**: Toca el icono ⚙️ en la esquina superior derecha
2. **Autenticar**: Ingresa la contraseña de administrador
3. **Ver y gestionar fuentes actuales**: Expande "Ver Fuentes de Datos Actuales" para:
   - Ver todos los archivos Excel y PDF cargados
   - **Activar/desactivar fuentes**: Usa el switch para incluir o excluir fuentes de la búsqueda
   - Ver el número de repuestos por cada fuente
   - **Eliminar fuentes personalizadas**: Solo puedes eliminar fuentes que hayas subido
4. **Actualizar base de datos**:
   - Selecciona uno o varios archivos Excel (.xlsx, .xls) o PDF
   - Haz clic en "Procesar X archivo(s)"
   - Espera a que se procesen todos los archivos
   - La aplicación se actualizará automáticamente
5. **Optimizar búsquedas**:
   - Desactiva fuentes que no necesites para obtener resultados más rápidos y relevantes
   - Las fuentes desactivadas no aparecerán en los resultados de búsqueda
   - Puedes reactivarlas en cualquier momento

## �️ Tecnologías utilizadas

- **React Native + Expo**: Framework móvil multiplataforma
- **React Native Paper**: Componentes UI Material Design
- **XLSX**: Procesamiento de archivos Excel
- **Vercel**: Deployment y hosting
- **GitHub**: Control de versiones

## 📋 Formato de datos

### Archivos Excel

El archivo Excel debe tener estas columnas (detección automática):

| Código     | Descripción                    |
|------------|--------------------------------|
| 0880070812 | CABLE PARALELO CENTRONICS 5M   |
| 0880073285 | CABLE PARALELO CENTRONICS 7M   |
| 0800337132 | CLUNCH (EMBRAGUE DEL ROLLO)    |

**Nombres compatibles:**
- **Códigos**: "Códigos", "Code", "Cod", "ID" o primera columna
- **Descripciones**: "Descripciones", "Description", "Desc", "Nombre" o segunda columna

### Archivos PDF

Para añadir catálogos en PDF:

```bash
# 1. Copiar PDFs a data/pdfs/

# 2. Procesar texto de PDFs
node processPDFs.js

# 3. Copiar PDFs a carpeta pública (para que se puedan abrir en la web)
node copyPDFsToPublic.js

# 4. Copiar JSONs procesados
# Windows:
Copy-Item data\processed\*.json src\data\processed\ -Force
# L

### Archivo Excel

Para actualizar o cambiar el archivo Excel:

```bash
# 1. Reemplazar data/repuestos.xlsx con tu archivo

# 2. Convertir Excel a JSON
node convertExcel.js

# 3. Copiar Excel a carpeta pública (para que se pueda abrir en la web)
node copyExcelToPublic.js

# 4. La app se actualizará automáticamente
```inux/Mac:
cp data/processed/*.json src/data/processed/
```

## � Instalación local

```bash
# Clonar repositorio
git clone https://github.com/tatoina/repuestosFujitsu.git
cd repuestosFujitsu

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start

# Ver en navegador
npm run web

# Ver en móvil (requiere Expo Go)
# Escanear QR code con Expo Go app
```

## 📦 Deployment

### Vercel (Recomendado):
1. Conecta el repositorio de GitHub a Vercel
2. La aplicación se despliega automáticamente
3. Accesible desde cualquier dispositivo web

### Expo (Para apps nativas):
```bash
# Build para producción
expo build:web

# O usar EAS Build para apps nativas
eas build --platform all
```

## 🔧 Configuración

### Variables de entorno:
- `ADMIN_PASSWORD`: Contraseña del panel de administración (default: "fujitsu")

### Personalización:
- Modifica `src/services/searchService.js` para cambiar la lógica de búsqueda
- Edita `src/components/AdminPanel.js` para personalizar el panel de administración
- Ajusta estilos en cada componente según necesidades

## 📊 Estructura del proyecto

```
RepuestosFuji/
├── src/
│   ├── components/
│   │   ├── SearchComponent.js       # Componente principal de búsqueda
│   │   └── AdminPanel.js            # Panel de administración
│   ├── services/
│   │   ├── searchService.js         # Búsqueda básica (Excel)
│   │   └── searchServiceUnified.js  # Búsqueda unificada (Excel + PDFs)
│   └── data/
│       ├── repuestos.json           # Datos convertidos del Excel
│       └── processed/
│           └── pdfs-data.json       # Datos procesados de PDFs
├── data/
│   ├── repuestos.xlsx              # Archivo Excel original
│   ├── pdfs/                       # PDFs de catálogos (originales)
│   ├── processed/                  # Datos procesados
│   └── README.md                   # Instrucciones para datos
├── public/
│   ├── pdfs/                       # PDFs accesibles en web
│   └── index.html
├── processPDFs.js                 # Script: procesar texto de PDFs
├── copyPDFsToPublic.js            # Script: copiar PDFs a public
├── convertExcel.js                # Script: conversión Excel → JSON
├── App.js                         # Componente raíz
└── package.json                   # Dependencias
```

## 🔒 Seguridad

- Panel de administración protegido con contraseña
- Validación de archivos Excel antes del procesamiento
- Sanitización de datos de entrada
- Control de acceso por roles

## � Solución de problemas

### La app no encuentra mi Excel:
1. Asegúrate de que esté en `/data/repuestos.xlsx`
2. Verifica que tenga columnas de código y descripción
3. Usa el script `node convertExcel.js` para convertir manualmente

### No aparecen resultados de búsqueda:
1. Verifica que los datos estén cargados (consola del navegador)
2. Comprueba que la búsqueda coincida con el contenido
3. Prueba cambiar entre modo código/descripción

### Error en el panel de administración:
1. Verifica la contraseña de administrador
2. Asegúrate de usar archivos Excel válidos (.xlsx/.xls)
3. Revisa la consola para mensajes de error detallados

## � Licencia

Este proyecto es de uso libre para fines educativos y comerciales.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: [tu-email@fujitsu.com]
- 🐛 Issues: [GitHub Issues](https://github.com/tatoina/repuestosFujitsu/issues)
- 📖 Documentación: Ver archivos README en cada carpeta

---

**Desarrollado con ❤️ para optimizar la gestión de repuestos**
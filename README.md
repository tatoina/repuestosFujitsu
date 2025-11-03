# RepuestosFuji 🔧

Una aplicación móvil React Native para búsqueda bidireccional de códigos y descripciones de repuestos. Desarrollada para optimizar la gestión de inventario con búsqueda en tiempo real y panel de administración integrado.

## 🌟 Demo en vivo

**🔗 [Abrir aplicación](https://repuestosfuji.vercel.app)**

## 🚀 Características principales

- ✅ **Búsqueda bidireccional**: Código → Descripción o Descripción → Código
- ✅ **Búsqueda en tiempo real**: Resultados instantáneos mientras escribes
- ✅ **Panel de administración**: Actualizar base de datos con contraseña
- ✅ **Procesamiento Excel**: Carga automática de archivos .xlsx/.xls
- ✅ **Responsive**: Optimizado para móvil y escritorio
- ✅ **Auto-detección**: Reconoce automáticamente columnas de código/descripción
- ✅ **Interfaz moderna**: Material Design con React Native Paper

## 📱 Cómo usar

### Para usuarios finales:
1. **Buscar por descripción**: Escribe parte de la descripción para obtener el código
2. **Buscar por código**: Cambia el modo y busca por código para obtener la descripción
3. **Copiar resultados**: Toca "Copiar" en cualquier resultado

### Para administradores:
1. **Acceder al panel**: Toca el icono ⚙️ en la esquina superior derecha
2. **Autenticar**: Ingresa la contraseña de administrador
3. **Subir Excel**: Selecciona un archivo Excel para actualizar la base de datos
4. **Automático**: El sistema detecta las columnas y actualiza inmediatamente

## �️ Tecnologías utilizadas

- **React Native + Expo**: Framework móvil multiplataforma
- **React Native Paper**: Componentes UI Material Design
- **XLSX**: Procesamiento de archivos Excel
- **Vercel**: Deployment y hosting
- **GitHub**: Control de versiones

## 📋 Formato de datos

El archivo Excel debe tener estas columnas (detección automática):

| Código     | Descripción                    |
|------------|--------------------------------|
| 0880070812 | CABLE PARALELO CENTRONICS 5M   |
| 0880073285 | CABLE PARALELO CENTRONICS 7M   |
| 0800337132 | CLUNCH (EMBRAGUE DEL ROLLO)    |

**Nombres compatibles:**
- **Códigos**: "Códigos", "Code", "Cod", "ID" o primera columna
- **Descripciones**: "Descripciones", "Description", "Desc", "Nombre" o segunda columna

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
│   │   ├── SearchComponent.js    # Componente principal de búsqueda
│   │   └── AdminPanel.js         # Panel de administración
│   ├── services/
│   │   └── searchService.js      # Lógica de búsqueda y datos
│   └── data/
│       └── repuestos.json        # Datos convertidos del Excel
├── data/
│   ├── repuestos.xlsx           # Archivo Excel original
│   └── README.md                # Instrucciones para datos
├── convertExcel.js              # Script de conversión Excel → JSON
├── App.js                       # Componente raíz
└── package.json                 # Dependencias
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
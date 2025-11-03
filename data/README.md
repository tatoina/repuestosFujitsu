# Carpeta de Datos

Esta carpeta es donde debes colocar tu archivo Excel con los datos de repuestos.

## Instrucciones:

1. **Nombre del archivo**: `repuestos.xlsx`
2. **Ubicación**: Coloca el archivo en esta carpeta `/data/repuestos.xlsx`

## Formato del Excel:

Tu archivo Excel debe tener las siguientes columnas (pueden tener diferentes nombres):

| Código    | Descripción                |
|-----------|----------------------------|
| FLT001    | Filtro de aceite motor     |
| BRK002    | Pastillas de freno         |
| SPK003    | Bujías de encendido        |
| ...       | ...                        |

### Nombres de columnas compatibles:

**Para códigos:**
- "Código", "Code", "Cod", "ID", o la primera columna

**Para descripciones:**
- "Descripción", "Description", "Desc", "Nombre", "Name", o la segunda columna

## Notas importantes:

- La aplicación detectará automáticamente las columnas correctas
- Si no se puede cargar el archivo, la app mostrará datos de ejemplo
- Asegúrate de que el archivo no esté abierto en Excel cuando ejecutes la app
- Formatos soportados: .xlsx, .xls

## ¿Cómo convertir PDF a Excel?

1. Usa herramientas online como PDF24, SmallPDF, o ILovePDF
2. O abre el PDF en Adobe Acrobat y exporta como Excel
3. Revisa que los datos estén en las columnas correctas
4. Guarda como `repuestos.xlsx` en esta carpeta
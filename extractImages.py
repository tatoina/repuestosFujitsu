"""
Script para extraer imágenes de PDFs y vincularlas con los repuestos
Usa PyMuPDF (fitz) para extracción de imágenes
"""

import fitz  # PyMuPDF
import os
import json
from pathlib import Path

# Directorios
PDFS_DIR = Path("data/pdfs")
IMAGES_DIR = Path("data/images")
OUTPUT_JSON = Path("data/processed/images-mapping.json")

# Crear directorio de imágenes
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

print("🖼️  Iniciando extracción de imágenes de PDFs...\n")

images_mapping = {}
total_images = 0

# Procesar cada PDF
for pdf_file in PDFS_DIR.glob("*.pdf"):
    print(f"📄 Procesando: {pdf_file.name}")
    
    try:
        doc = fitz.open(pdf_file)
        pdf_images = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            
            for img_index, img in enumerate(image_list):
                xref = img[0]
                
                try:
                    # Extraer imagen
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Generar nombre de archivo
                    image_filename = f"{pdf_file.stem}_page{page_num + 1}_img{img_index + 1}.{image_ext}"
                    image_path = IMAGES_DIR / image_filename
                    
                    # Guardar imagen
                    with open(image_path, "wb") as img_file:
                        img_file.write(image_bytes)
                    
                    pdf_images.append({
                        "filename": image_filename,
                        "page": page_num + 1,
                        "index": img_index + 1,
                        "path": str(image_path.relative_to(Path(".")))
                    })
                    
                    total_images += 1
                    
                except Exception as e:
                    print(f"   ⚠️  Error extrayendo imagen {img_index + 1} de página {page_num + 1}: {e}")
        
        doc.close()
        
        images_mapping[pdf_file.name] = {
            "total_images": len(pdf_images),
            "images": pdf_images
        }
        
        print(f"   ✅ Extraídas {len(pdf_images)} imágenes\n")
        
    except Exception as e:
        print(f"   ❌ Error procesando {pdf_file.name}: {e}\n")

# Guardar mapping
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(images_mapping, f, indent=2, ensure_ascii=False)

print(f"✅ Extracción completada!")
print(f"📊 Total de imágenes extraídas: {total_images}")
print(f"💾 Mapping guardado en: {OUTPUT_JSON}")
print(f"🖼️  Imágenes guardadas en: {IMAGES_DIR}\n")

# Mostrar muestra
print("📋 Muestra de imágenes por PDF:")
for pdf_name, data in list(images_mapping.items())[:5]:
    print(f"\n{pdf_name}: {data['total_images']} imágenes")
    if data['images']:
        print(f"  - {data['images'][0]['filename']}")

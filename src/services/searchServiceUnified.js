import * as XLSX from 'xlsx';
import { Asset } from 'expo-asset';
import pdfData from '../data/processed/pdfs-data.json';
import imagesMapping from '../data/processed/images-mapping.json';

class SearchService {
  constructor() {
    this.excelData = [];
    this.pdfData = [];
    this.imagesMapping = {};
    this.isDataLoaded = false;
  }

  async loadData() {
    try {
      console.log('Cargando datos Excel, PDFs e imágenes...');
      
      // Cargar datos de Excel (JSON estático + localStorage)
      try {
        const repuestosData = require('../data/repuestos.json');
        this.excelData = repuestosData;
        console.log(`✅ Datos Excel cargados: ${this.excelData.length} repuestos`);
        
        // Añadir datos cargados por el usuario desde localStorage
        if (typeof localStorage !== 'undefined') {
          const userExcelData = JSON.parse(localStorage.getItem('excelData') || '[]');
          if (userExcelData.length > 0) {
            this.excelData = [...this.excelData, ...userExcelData];
            console.log(`✅ + ${userExcelData.length} repuestos de archivos subidos`);
          }
        }
      } catch (error) {
        console.log('⚠️ No se pudieron cargar datos Excel');
        this.excelData = [];
      }

      // Cargar datos de PDFs (JSON estático + localStorage)
      try {
        if (pdfData && pdfData.parts) {
          this.pdfData = pdfData.parts;
          console.log(`✅ Datos PDFs cargados: ${this.pdfData.length} repuestos de ${pdfData.totalPDFs} PDFs`);
        }
        
        // Añadir PDFs cargados por el usuario desde localStorage
        if (typeof localStorage !== 'undefined') {
          const userPdfData = JSON.parse(localStorage.getItem('pdfData') || '[]');
          if (userPdfData.length > 0) {
            this.pdfData = [...this.pdfData, ...userPdfData];
            console.log(`✅ + ${userPdfData.length} repuestos de PDFs subidos`);
          }
        }
      } catch (error) {
        console.log('⚠️ No se pudieron cargar datos PDFs');
        this.pdfData = [];
      }

      // Cargar mapping de imágenes
      try {
        if (imagesMapping) {
          this.imagesMapping = imagesMapping;
          const totalImages = Object.values(imagesMapping).reduce((sum, pdf) => sum + (pdf.total_images || 0), 0);
          console.log(`✅ Mapping de imágenes cargado: ${totalImages} imágenes de ${Object.keys(imagesMapping).length} PDFs`);
        }
      } catch (error) {
        console.log('⚠️ No se pudo cargar mapping de imágenes');
        this.imagesMapping = {};
      }

      this.isDataLoaded = true;
      console.log(`🎯 Total de repuestos: ${this.excelData.length + this.pdfData.length}`);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      this.loadSampleData();
    }
  }

  search(query, searchType = 'description') {
    if (!query || !this.isDataLoaded) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();
    const results = [];

    // Buscar en datos de Excel
    const excelResults = this.excelData.filter(item => {
      if (searchType === 'code') {
        return item.code && item.code.toLowerCase().includes(queryLower);
      } else {
        return item.description && item.description.toLowerCase().includes(queryLower);
      }
    }).map(item => ({
      ...item,
      source: 'Excel',
      sourceType: 'excel',
      hasImage: false
    }));

    // Buscar en datos de PDFs
    const pdfResults = this.pdfData.filter(item => {
      if (searchType === 'code') {
        return item.code && item.code.toLowerCase().includes(queryLower);
      } else {
        return item.description && item.description.toLowerCase().includes(queryLower);
      }
    }).map(item => {
      // Intentar encontrar la imagen correspondiente
      let imagePath = null;
      if (item.imageRef && item.source && this.imagesMapping[item.source]) {
        const pdfImages = this.imagesMapping[item.source].images || [];
        // Buscar imagen por índice (imageRef puede ser un número)
        const imageIndex = parseInt(item.imageRef);
        if (!isNaN(imageIndex) && imageIndex > 0 && imageIndex <= pdfImages.length) {
          const imageData = pdfImages[imageIndex - 1];
          if (imageData) {
            // Convertir ruta Windows a ruta web
            imagePath = `/images/${imageData.filename}`;
          }
        }
      }

      return {
        code: item.code,
        description: item.description,
        imageRef: item.imageRef,
        pdfSource: item.source,
        source: `PDF: ${item.source}`,
        sourceType: 'pdf',
        hasImage: !!item.imageRef,
        imagePath: imagePath,
        rawLine: item.rawLine
      };
    });

    // Combinar resultados y eliminar duplicados por código
    const pdfWithImages = pdfResults.filter(r => r.hasImage);
    const pdfWithoutImages = pdfResults.filter(r => !r.hasImage);
    
    // Combinar todos (PDFs con imágenes tienen prioridad, luego Excel, luego PDFs sin imágenes)
    const allResults = [...pdfWithImages, ...excelResults, ...pdfWithoutImages];
    
    // Eliminar duplicados por código (mantener el primero encontrado)
    const seenCodes = new Set();
    const uniqueResults = allResults.filter(item => {
      const code = item.code?.toLowerCase();
      if (!code || seenCodes.has(code)) {
        return false;
      }
      seenCodes.add(code);
      return true;
    });

    return uniqueResults.slice(0, 100); // Limitar a 100 resultados
  }

  loadSampleData() {
    // Datos de ejemplo si no se pueden cargar los reales
    this.excelData = [
      { code: '12345', description: 'Cable de alimentación' },
      { code: '67890', description: 'Filtro de aceite' }
    ];
    this.isDataLoaded = true;
  }

  getStatistics() {
    return {
      totalExcel: this.excelData.length,
      totalPDF: this.pdfData.length,
      totalParts: this.excelData.length + this.pdfData.length,
      pdfsProcessed: pdfData.totalPDFs || 0,
      processedDate: pdfData.processedDate || null
    };
  }
}

export const searchService = new SearchService();

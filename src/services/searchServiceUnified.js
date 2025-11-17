import * as XLSX from 'xlsx';
import { Asset } from 'expo-asset';
import pdfData from '../data/processed/pdfs-data.json';

class SearchService {
  constructor() {
    this.excelData = [];
    this.pdfData = [];
    this.isDataLoaded = false;
  }

  async loadData() {
    try {
      console.log('Cargando datos Excel y PDFs...');
      
      // Cargar datos de Excel
      try {
        const repuestosData = require('../data/repuestos.json');
        this.excelData = repuestosData;
        console.log(`✅ Datos Excel cargados: ${this.excelData.length} repuestos`);
      } catch (error) {
        console.log('⚠️ No se pudieron cargar datos Excel');
        this.excelData = [];
      }

      // Cargar datos de PDFs
      try {
        if (pdfData && pdfData.parts) {
          this.pdfData = pdfData.parts;
          console.log(`✅ Datos PDFs cargados: ${this.pdfData.length} repuestos de ${pdfData.totalPDFs} PDFs`);
        }
      } catch (error) {
        console.log('⚠️ No se pudieron cargar datos PDFs');
        this.pdfData = [];
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
    }).map(item => ({
      code: item.code,
      description: item.description,
      imageRef: item.imageRef,
      pdfSource: item.source,
      source: `PDF: ${item.source}`,
      sourceType: 'pdf',
      hasImage: !!item.imageRef,
      rawLine: item.rawLine
    }));

    // Combinar resultados (PDFs primero si tienen imágenes)
    const pdfWithImages = pdfResults.filter(r => r.hasImage);
    const pdfWithoutImages = pdfResults.filter(r => !r.hasImage);
    
    results.push(...pdfWithImages, ...excelResults, ...pdfWithoutImages);

    return results.slice(0, 100); // Limitar a 100 resultados
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

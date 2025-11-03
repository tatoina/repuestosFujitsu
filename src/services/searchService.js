import * as XLSX from 'xlsx';
import { Asset } from 'expo-asset';

class SearchService {
  constructor() {
    this.data = [];
    this.isDataLoaded = false;
  }

  async loadData() {
    try {
      console.log('Cargando datos reales del usuario...');
      
      // Cargar datos desde el JSON generado
      try {
        const repuestosData = require('../data/repuestos.json');
        this.data = repuestosData;
        this.isDataLoaded = true;
        console.log(`✅ Datos reales cargados: ${this.data.length} repuestos`);
        
        // Mostrar algunos ejemplos con "cable"
        const cables = this.data.filter(item => 
          item.description.toLowerCase().includes('cable')
        );
        console.log(`🔌 Cables encontrados: ${cables.length}`);
        if (cables.length > 0) {
          console.log('Primeros 5 cables:', cables.slice(0, 5).map(c => c.description));
        }
        return;
      } catch (error) {
        console.log('No se pudieron cargar datos reales, usando datos de ejemplo');
        this.loadSampleDataWithCables();
      }

      // Procesar el archivo Excel
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Procesar los datos y asegurar que tengan la estructura correcta
      this.data = jsonData.map((row, index) => {
        // Intentar detectar las columnas automáticamente
        const keys = Object.keys(row);
        
        let code = '';
        let description = '';

        // Buscar columnas que parezcan códigos (primera columna o que contenga 'cod', 'code', etc.)
        const codeColumn = keys.find(key => 
          key.toLowerCase().includes('cod') || 
          key.toLowerCase().includes('code') ||
          keys.indexOf(key) === 0
        );

        // Buscar columnas que parezcan descripciones
        const descColumn = keys.find(key => 
          key.toLowerCase().includes('desc') || 
          key.toLowerCase().includes('description') ||
          key.toLowerCase().includes('nombre') ||
          (keys.indexOf(key) === 1 && !key.toLowerCase().includes('cod'))
        );

        if (codeColumn) {
          code = String(row[codeColumn] || '').trim();
        }
        
        if (descColumn) {
          description = String(row[descColumn] || '').trim();
        }

        // Si no encontramos columnas específicas, usar las primeras dos
        if (!code && !description && keys.length >= 2) {
          code = String(row[keys[0]] || '').trim();
          description = String(row[keys[1]] || '').trim();
        }

        return {
          id: index + 1,
          code: code,
          description: description,
          originalData: row
        };
      }).filter(item => item.code && item.description); // Filtrar filas vacías

      this.isDataLoaded = true;
      console.log(`Datos cargados exitosamente: ${this.data.length} repuestos desde ${loadedPath}`);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Cargar datos de ejemplo como fallback
      this.loadSampleData();
    }
  }

  loadSampleDataWithCables() {
    // Datos de ejemplo que incluyen cables y más variedad
    this.data = [
      {
        id: 1,
        code: 'FLT001',
        description: 'Filtro de aceite motor'
      },
      {
        id: 2,
        code: 'BRK002',
        description: 'Pastillas de freno delanteras'
      },
      {
        id: 3,
        code: 'SPK003',
        description: 'Bujías de encendido'
      },
      {
        id: 4,
        code: 'AIR004',
        description: 'Filtro de aire'
      },
      {
        id: 5,
        code: 'BAT005',
        description: 'Batería 12V'
      },
      {
        id: 6,
        code: 'CBL001',
        description: 'Cable de batería positivo'
      },
      {
        id: 7,
        code: 'CBL002',
        description: 'Cable de batería negativo'
      },
      {
        id: 8,
        code: 'CBL003',
        description: 'Cable de bujía 1'
      },
      {
        id: 9,
        code: 'CBL004',
        description: 'Cable de bujía 2'
      },
      {
        id: 10,
        code: 'CBL005',
        description: 'Cable acelerador'
      },
      {
        id: 11,
        code: 'CBL006',
        description: 'Cable embrague'
      },
      {
        id: 12,
        code: 'CBL007',
        description: 'Cable freno mano'
      },
      {
        id: 13,
        code: 'TIR006',
        description: 'Neumático 205/55R16'
      },
      {
        id: 14,
        code: 'LMP007',
        description: 'Bombilla halógena H7'
      },
      {
        id: 15,
        code: 'WIP008',
        description: 'Escobillas limpiaparabrisas'
      },
      {
        id: 16,
        code: 'FLU009',
        description: 'Líquido de frenos DOT4'
      },
      {
        id: 17,
        code: 'CLT010',
        description: 'Correa de distribución'
      }
    ];
    
    this.isDataLoaded = true;
    console.log(`Datos de ejemplo cargados exitosamente: ${this.data.length} repuestos`);
    console.log('Cables disponibles:', this.data.filter(item => 
      item.description.toLowerCase().includes('cable')).map(item => item.description));
  }

  async search(query, searchType = 'description') {
    console.log(`Ejecutando búsqueda: "${query}", tipo: ${searchType}`);
    
    if (!this.isDataLoaded) {
      console.log('Datos no cargados, cargando...');
      await this.loadData();
    }

    if (!query || !query.trim()) {
      console.log('Query vacía, retornando array vacío');
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    console.log(`Término de búsqueda procesado: "${searchTerm}"`);
    console.log(`Total de datos disponibles: ${this.data.length}`);
    
    const filtered = this.data.filter(item => {
      if (searchType === 'code') {
        const match = item.code.toLowerCase().includes(searchTerm);
        if (match) console.log(`Coincidencia por código: ${item.code} -> ${item.description}`);
        return match;
      } else {
        const match = item.description.toLowerCase().includes(searchTerm);
        if (match) console.log(`Coincidencia por descripción: ${item.description} -> ${item.code}`);
        return match;
      }
    });
    
    console.log(`Elementos filtrados: ${filtered.length}`);
    
    return filtered.sort((a, b) => {
      // Ordenar por relevancia: coincidencias exactas primero
      const aField = searchType === 'code' ? a.code.toLowerCase() : a.description.toLowerCase();
      const bField = searchType === 'code' ? b.code.toLowerCase() : b.description.toLowerCase();
      
      // Coincidencia exacta
      const aExact = aField === searchTerm;
      const bExact = bField === searchTerm;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Empieza con el término
      const aStartsWith = aField.startsWith(searchTerm);
      const bStartsWith = bField.startsWith(searchTerm);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Ordenar alfabéticamente si tienen la misma relevancia
      return aField.localeCompare(bField);
    }).slice(0, 50); // Limitar a 50 resultados para mejor rendimiento
  }

  getAllData() {
    return this.data;
  }

  getDataCount() {
    return this.data.length;
  }

  isLoaded() {
    return this.isDataLoaded;
  }

  // Método para actualizar datos desde el panel de administración
  async updateData(newData) {
    try {
      this.data = newData;
      this.isDataLoaded = true;
      console.log(`✅ Base de datos actualizada: ${this.data.length} repuestos`);
      
      // En una app real, aquí guardarías los datos en AsyncStorage o servidor
      // Por ahora solo los mantenemos en memoria
      
      return true;
    } catch (error) {
      console.error('Error actualizando datos:', error);
      throw error;
    }
  }
}

// Exportar una instancia singleton
export const searchService = new SearchService();
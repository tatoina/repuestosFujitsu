import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
// v2.2.0 - Búsqueda automática inteligente + Abrir PDFs directamente
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  ActivityIndicator,
  Provider as PaperProvider,
  IconButton,
  Checkbox,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { searchService } from '../services/searchServiceUnified';
import AdminPanel from './AdminPanel';
import PWAInstallPrompt from './PWAInstallPrompt';

const SearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentSearchType, setCurrentSearchType] = useState('description'); // Para mostrar al usuario qué tipo de búsqueda se está haciendo
  const [stats, setStats] = useState(null);
  const [searchSources, setSearchSources] = useState({ excel: true, pdf: true }); // Fuentes de búsqueda activas

  useEffect(() => {
    // Solo inicializar datos una vez
    const init = async () => {
      try {
        setIsLoading(true);
        await searchService.loadData();
        const statistics = searchService.getStatistics();
        setStats(statistics);
        setDataLoaded(true);
      } catch (error) {
        Alert.alert(
          'Error',
          'No se pudo cargar la base de datos. Asegúrate de que el archivo Excel esté en la carpeta /data'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []); // Sin dependencias adicionales

  const handleSearch = async (query = searchQuery, sources = searchSources) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchType('description');
      return;
    }

    // Detectar automáticamente el tipo de búsqueda
    const firstChar = query.trim().charAt(0);
    const isNumeric = /\d/.test(firstChar);
    const searchType = isNumeric ? 'code' : 'description';
    
    setCurrentSearchType(searchType);
    console.log(`Búsqueda automática: "${query}" detectado como ${searchType === 'code' ? 'código' : 'descripción'}`);
    console.log(`Fuentes activas: Excel=${sources.excel}, PDF=${sources.pdf}`);

    try {
      setIsLoading(true);
      const results = await searchService.search(query, searchType, sources);
      console.log(`Resultados encontrados: ${results.length}`);
      setSearchResults(results);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Alert.alert('Error', 'Error al realizar la búsqueda');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSearchSource = (source) => {
    const newSources = { ...searchSources, [source]: !searchSources[source] };
    
    // Al menos una fuente debe estar activa
    if (!newSources.excel && !newSources.pdf) {
      Alert.alert('Aviso', 'Debes tener al menos una fuente de búsqueda activa');
      return;
    }
    
    setSearchSources(newSources);
    
    // Re-ejecutar búsqueda si hay texto
    if (searchQuery.trim()) {
      handleSearch(searchQuery, newSources);
    }
  };

  // Búsqueda en tiempo real con detección automática
  const handleTextChange = (text) => {
    setSearchQuery(text);
    
    // Si no hay texto, limpiar resultados inmediatamente
    if (!text.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      setCurrentSearchType('description');
      return;
    }
    
    // Mostrar loading inmediatamente
    setIsLoading(true);
    
    // Crear nuevo timer para búsqueda con delay
    const newTimer = setTimeout(() => {
      handleSearch(text);
    }, 300); // 300ms de delay
    
    // Limpiar timer anterior si existe
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    setDebounceTimer(newTimer);
  };

  const copyToClipboard = async (text) => {
    try {
      // Usar la API del Clipboard para web y móvil
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        Alert.alert('✅ Copiado', `"${text}" copiado al portapapeles`);
      } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          Alert.alert('✅ Copiado', `"${text}" copiado al portapapeles`);
        } catch (err) {
          Alert.alert('Error', 'No se pudo copiar al portapapeles');
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Error al copiar:', error);
      Alert.alert('Error', 'No se pudo copiar al portapapeles');
    }
  };

  if (!dataLoaded && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando base de datos...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <PWAInstallPrompt />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>Búsqueda de Repuestos</Title>
            <IconButton
              icon="cog"
              size={24}
              onPress={() => setShowAdminPanel(true)}
              style={styles.adminButton}
            />
          </View>
          
          {/* Estadísticas de la base de datos */}
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>📊 Base de Datos:</Text>
              <View style={styles.statsRow}>
                <Chip icon="file-excel" style={styles.excelStat} textStyle={styles.statText}>
                  Excel: {stats.totalExcel}
                </Chip>
                <Chip icon="file-pdf-box" style={styles.pdfStat} textStyle={styles.statText}>
                  PDFs: {stats.totalPDF}
                </Chip>
                <Chip icon="check-all" style={styles.totalStat} textStyle={styles.statText}>
                  Total: {stats.totalParts}
                </Chip>
              </View>
            </View>
          )}
          
          {/* Fecha actual para verificar actualizaciones */}
          <Text style={styles.dateText}>
            📚 Busca en EXCEL y PDFs simultáneamente - 21 Ene 2026
          </Text>

          {/* Selector de fuentes de búsqueda */}
          <View style={styles.sourceFilterContainer}>
            <Text style={styles.sourceFilterLabel}>Buscar en:</Text>
            <View style={styles.sourceFilterButtons}>
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => toggleSearchSource('excel')}
              >
                <Checkbox
                  status={searchSources.excel ? 'checked' : 'unchecked'}
                  onPress={() => toggleSearchSource('excel')}
                  color="#6200ee"
                />
                <Text style={styles.checkboxLabel}>📊 Excel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => toggleSearchSource('pdf')}
              >
                <Checkbox
                  status={searchSources.pdf ? 'checked' : 'unchecked'}
                  onPress={() => toggleSearchSource('pdf')}
                  color="#6200ee"
                />
                <Text style={styles.checkboxLabel}>📄 PDFs</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Indicador de tipo de búsqueda */}
          {searchQuery.trim() && (
            <View style={styles.searchTypeIndicator}>
              <Chip 
                icon={() => (
                  <Ionicons
                    name={currentSearchType === 'description' ? 'text' : 'barcode'}
                    size={16}
                    color="#6200ee"
                  />
                )}
                style={[styles.chip, styles.activeChip]}
                textStyle={styles.activeChipText}
              >
                {currentSearchType === 'description' ? 'Buscando por Descripción' : 'Buscando por Código'}
              </Chip>
            </View>
          )}

          <Searchbar
            placeholder="Escribe código (123...) o descripción (abc...) para buscar"
            onChangeText={handleTextChange}
            value={searchQuery}
            onSubmitEditing={() => handleSearch()}
            style={styles.searchbar}
            icon={() => (
              <Ionicons
                name="search"
                size={20}
                color="#666"
              />
            )}
            autoFocus={true}
          />
          
          {/* Ayuda para el usuario */}
          {!searchQuery.trim() && (
            <Text style={styles.helpText}>
              💡 Tip: Comienza con número para buscar código, con letra para descripción
            </Text>
          )}
        </View>

        <ScrollView style={styles.resultsContainer}>
          {isLoading && searchQuery.trim() && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
              <Text style={styles.searchingText}>Buscando...</Text>
            </View>
          )}
          
          {searchResults.length > 0 && !isLoading && (
            <Text style={styles.resultsCount}>
              {searchResults.length} resultado(s) encontrado(s)
            </Text>
          )}

          {searchResults.map((item, index) => (
            <Card key={index} style={styles.resultCard}>
              <Card.Content>
                <View style={styles.resultHeader}>
                  <View style={[
                    styles.sourceIndicator, 
                    item.sourceType === 'pdf' ? styles.pdfIndicator : styles.excelIndicator
                  ]}>
                    <Ionicons 
                      name={item.sourceType === 'pdf' ? 'document-text' : 'table'} 
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.sourceIndicatorText}>
                      {item.sourceType === 'pdf' ? 'PDF' : 'EXCEL'}
                    </Text>
                  </View>
                  <Title style={styles.resultTitle}>
                    {currentSearchType === 'description' ? item.code : item.description}
                  </Title>
                </View>
                
                <Paragraph style={styles.resultSubtitle}>
                  {currentSearchType === 'description' ? item.description : item.code}
                </Paragraph>

                {/* Mostrar fuente */}
                <View style={styles.sourceInfo}>
                  <Chip 
                    icon={() => (
                      <Ionicons 
                        name={item.sourceType === 'pdf' ? 'document' : 'document-outline'} 
                        size={14} 
                        color={item.sourceType === 'pdf' ? '#ff6f00' : '#6200ee'}
                      />
                    )}
                    style={[styles.sourceChip, item.sourceType === 'pdf' && styles.pdfChip]}
                    textStyle={styles.chipText}
                  >
                    {item.source}
                  </Chip>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(
                      currentSearchType === 'description' ? item.code : item.description
                    )}
                  >
                    <Ionicons name="copy" size={16} color="#6200ee" />
                    <Text style={styles.copyButtonText}>Copiar</Text>
                  </TouchableOpacity>
                  
                  {item.sourceType === 'pdf' && item.pdfSource && (
                    <TouchableOpacity
                      style={styles.pdfButton}
                      onPress={() => {
                        const pdfUrl = `/pdfs/${item.pdfSource}`;
                        window.open(pdfUrl, '_blank');
                      }}
                    >
                      <Ionicons name="document-text" size={16} color="#ff6f00" />
                      <Text style={styles.pdfButtonText}>Abrir PDF</Text>
                    </TouchableOpacity>
                  )}
                  
                  {item.sourceType === 'excel' && (
                    <TouchableOpacity
                      style={styles.excelButton}
                      onPress={() => {
                        const excelUrl = `/repuestos.xlsx`;
                        window.open(excelUrl, '_blank');
                      }}
                    >
                      <Ionicons name="table" size={16} color="#217346" />
                      <Text style={styles.excelButtonText}>Abrir Excel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))}

          {searchQuery && searchResults.length === 0 && !isLoading && (
            <Card style={styles.noResultsCard}>
              <Card.Content>
                <View style={styles.noResultsContent}>
                  <Ionicons name="search" size={48} color="#ccc" />
                  <Title style={styles.noResultsTitle}>
                    No se encontraron resultados
                  </Title>
                  <Paragraph style={styles.noResultsText}>
                    Intenta con otros términos de búsqueda o cambia el tipo de búsqueda
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        <AdminPanel 
          visible={showAdminPanel}
          onDismiss={() => setShowAdminPanel(false)}
        />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 12,
    paddingTop: 45,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#6200ee',
    flex: 1,
    fontSize: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  adminButton: {
    position: 'absolute',
    right: 0,
    top: -8,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    marginHorizontal: 4,
  },
  searchbar: {
    marginBottom: 8,
    marginTop: 4,
    elevation: 2,
  },
  searchButton: {
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6200ee',
  },
  resultCard: {
    marginBottom: 12,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  excelIndicator: {
    backgroundColor: '#6200ee',
  },
  pdfIndicator: {
    backgroundColor: '#ff6f00',
  },
  sourceIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  resultTitle: {
    marginLeft: 8,
    fontSize: 18,
    color: '#6200ee',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  searchTypeIndicator: {
    marginBottom: 6,
    alignItems: 'center',
  },
  helpText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsContainer: {
    backgroundColor: '#f8f8f8',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
    elevation: 0,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: 4,
  },
  excelStat: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 2,
    height: 24,
  },
  pdfStat: {
    backgroundColor: '#fff3e0',
    marginHorizontal: 2,
    height: 24,
  },
  totalStat: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 2,
    height: 24,
  },
  statText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  sourceInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 4,
  },
  sourceChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
  pdfChip: {
    backgroundColor: '#fff3e0',
  },
  imageChip: {
    backgroundColor: '#e8f5e9',
  },
  chipText: {
    fontSize: 11,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#fff3e0',
    marginLeft: 8,
  },
  pdfButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#ff6f00',
    fontWeight: '500',
  },
  excelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#e7f5ee',
    marginLeft: 8,
  },
  excelButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#217346',
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  copyButtonText: {
    marginLeft: 4,
    color: '#6200ee',
    fontSize: 12,
  },
  dateText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  sourceFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  sourceFilterLabel: {
    fontSize: 11,
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
  },
  sourceFilterButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ scale: 0.85 }],
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#333',
    marginLeft: -8,
  },
  noResultsCard: {
    marginTop: 32,
    elevation: 2,
  },
  noResultsContent: {
    alignItems: 'center',
    padding: 16,
  },
  noResultsTitle: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
  noResultsText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#999',
  },
});

export default SearchComponent;
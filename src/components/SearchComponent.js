import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
// v2.1.0 - Búsqueda automática inteligente + Imágenes extraídas
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
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
              <Chip 
                selected={searchSources.excel}
                onPress={() => toggleSearchSource('excel')}
                icon="file-excel"
                style={[
                  styles.sourceChip,
                  searchSources.excel ? styles.sourceChipActive : styles.sourceChipInactive
                ]}
                textStyle={searchSources.excel ? styles.sourceChipTextActive : styles.sourceChipTextInactive}
              >
                Excel
              </Chip>
              <Chip 
                selected={searchSources.pdf}
                onPress={() => toggleSearchSource('pdf')}
                icon="file-pdf-box"
                style={[
                  styles.sourceChip,
                  searchSources.pdf ? styles.sourceChipActive : styles.sourceChipInactive
                ]}
                textStyle={searchSources.pdf ? styles.sourceChipTextActive : styles.sourceChipTextInactive}
              >
                PDFs
              </Chip>
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

                {/* Mostrar fuente y número de imagen si existe */}
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
                  
                  {item.hasImage && item.imageRef && (
                    <Chip 
                      icon={() => <Ionicons name="camera" size={14} color="#4caf50" />}
                      style={styles.imageChip}
                      textStyle={styles.chipText}
                      onPress={() => Alert.alert(
                        '📷 Tiene Imagen',
                        `Este repuesto tiene foto en el PDF.\n\nBusca la imagen Nº ${item.imageRef} en "${item.pdfSource}"`,
                        [{ text: 'OK' }]
                      )}
                    >
                      📷 Tiene foto (#{item.imageRef})
                    </Chip>
                  )}
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
                  
                  {item.hasImage && (
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={() => {
                        if (item.imagePath) {
                          setSelectedImage({
                            path: item.imagePath,
                            code: item.code,
                            description: item.description,
                            imageRef: item.imageRef,
                            pdfSource: item.pdfSource
                          });
                          setShowImageModal(true);
                        } else {
                          Alert.alert(
                            '📷 Referencia a Imagen',
                            `Este repuesto tiene una imagen numerada:\n\n` +
                            `📄 PDF: ${item.pdfSource}\n` +
                            `🖼️ Imagen Nº: ${item.imageRef}\n\n` +
                            `⚠️ Imagen no disponible en este momento`,
                            [{ text: 'Entendido', style: 'default' }]
                          );
                        }
                      }}
                    >
                      <Ionicons name={item.imagePath ? "image" : "information-circle"} size={16} color="#4caf50" />
                      <Text style={styles.imageButtonText}>{item.imagePath ? "Ver Imagen" : "Info Imagen"}</Text>
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

        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>{selectedImage?.code}</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={2}>
                    {selectedImage?.description}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowImageModal(false)}
                >
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              
              {selectedImage?.path && (
                <ScrollView 
                  style={styles.imageScrollView}
                  contentContainerStyle={styles.imageScrollContent}
                >
                  <Image
                    source={{ uri: selectedImage.path }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <View style={styles.imageInfo}>
                    <Text style={styles.imageInfoText}>
                      📄 {selectedImage.pdfSource} | 🖼️ Imagen #{selectedImage.imageRef}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
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
    padding: 16,
    paddingTop: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6200ee',
    flex: 1,
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
    marginBottom: 12,
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
    marginBottom: 12,
    alignItems: 'center',
  },
  helpText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  excelStat: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: 4,
  },
  pdfStat: {
    backgroundColor: '#fff3e0',
    marginHorizontal: 4,
  },
  totalStat: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 4,
  },
  statText: {
    fontSize: 11,
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
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#e8f5e9',
    marginLeft: 8,
  },
  imageButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4caf50',
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
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sourceFilterContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  sourceFilterLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  sourceFilterButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  sourceChipActive: {
    backgroundColor: '#6200ee',
    marginHorizontal: 4,
  },
  sourceChipInactive: {
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  sourceChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sourceChipTextInactive: {
    color: '#999',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxWidth: 800,
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#6200ee',
  },
  modalHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalImage: {
    width: '100%',
    height: 500,
    maxHeight: '80%',
  },
  imageInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  imageInfoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});

export default SearchComponent;
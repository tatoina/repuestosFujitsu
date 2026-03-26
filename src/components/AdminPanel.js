import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Paragraph,
  Chip,
  List,
  Switch,
  SegmentedButtons,
  Divider,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as XLSX from 'xlsx';
import { searchService } from '../services/searchServiceUnified';

const AdminPanel = ({ visible, onDismiss }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('sources'); // 'sources' o 'update'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processedData, setProcessedData] = useState({ excel: 0, pdfs: 0, images: 0 });
  const [lastUpload, setLastUpload] = useState(null);
  const [dataSources, setDataSources] = useState({ excel: [], pdf: [] });

  // Cargar información de la última subida y fuentes de datos al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      const lastUploadInfo = localStorage.getItem('lastUploadInfo');
      if (lastUploadInfo) {
        setLastUpload(JSON.parse(lastUploadInfo));
      }
      loadDataSources();
    }
  }, [isAuthenticated]);

  const loadDataSources = () => {
    try {
      // Cargar preferencias de fuentes habilitadas
      const enabledSources = JSON.parse(localStorage.getItem('enabledSources') || '{}');
      
      // Obtener fuentes de Excel
      const excelSources = new Map();
      
      // Datos estáticos de JSON
      try {
        const repuestosData = require('../data/repuestos.json');
        repuestosData.forEach(item => {
          const source = item.source || 'repuestos.xlsx';
          excelSources.set(source, (excelSources.get(source) || 0) + 1);
        });
      } catch (e) {}
      
      // Datos cargados por usuario
      if (typeof localStorage !== 'undefined') {
        const userExcelData = JSON.parse(localStorage.getItem('excelData') || '[]');
        userExcelData.forEach(item => {
          const source = item.source || 'archivo.xlsx';
          excelSources.set(source, (excelSources.get(source) || 0) + 1);
        });
      }

      // Obtener fuentes de PDF
      const pdfSources = new Map();
      
      // Datos estáticos de JSON
      try {
        const pdfDataJson = require('../data/processed/pdfs-data.json');
        if (pdfDataJson && pdfDataJson.parts) {
          pdfDataJson.parts.forEach(item => {
            const source = item.source || 'documento.pdf';
            pdfSources.set(source, (pdfSources.get(source) || 0) + 1);
          });
        }
      } catch (e) {}
      
      // Datos cargados por usuario
      if (typeof localStorage !== 'undefined') {
        const userPdfData = JSON.parse(localStorage.getItem('pdfData') || '[]');
        userPdfData.forEach(item => {
          const source = item.source || 'documento.pdf';
          pdfSources.set(source, (pdfSources.get(source) || 0) + 1);
        });
      }

      // Convertir a arrays con estado de habilitación
      const excelSourcesArray = Array.from(excelSources.entries()).map(([name, count]) => ({
        name,
        count,
        type: 'excel',
        enabled: enabledSources[name] !== false // Por defecto habilitado si no existe
      }));

      const pdfSourcesArray = Array.from(pdfSources.entries()).map(([name, count]) => ({
        name,
        count,
        type: 'pdf',
        enabled: enabledSources[name] !== false // Por defecto habilitado si no existe
      }));

      setDataSources({ excel: excelSourcesArray, pdf: pdfSourcesArray });
    } catch (error) {
      console.error('Error cargando fuentes:', error);
    }
  };

  const toggleSourceEnabled = (sourceName) => {
    try {
      // Cargar preferencias actuales
      const enabledSources = JSON.parse(localStorage.getItem('enabledSources') || '{}');
      
      // Cambiar el estado
      enabledSources[sourceName] = !enabledSources[sourceName];
      
      // Guardar
      localStorage.setItem('enabledSources', JSON.stringify(enabledSources));
      
      // Recargar fuentes para actualizar UI
      loadDataSources();
      
      // Mensaje de confirmación
      const newState = enabledSources[sourceName] ? 'activada' : 'desactivada';
      Alert.alert('Fuente actualizada', `La fuente "${sourceName}" ha sido ${newState}.`);
    } catch (error) {
      Alert.alert('Error', `No se pudo actualizar la fuente: ${error.message}`);
    }
  };

  const removeDataSource = (sourceName, sourceType) => {
    // Verificar si es una fuente predeterminada (del JSON estático)
    const isDefaultSource = (sourceType === 'excel' && sourceName === 'repuestos.xlsx') ||
                           (sourceType === 'pdf' && [
                             'CONTROLADOR.pdf', 'CRW.pdf', 'G510.pdf', 'LIBRETAS.pdf',
                             'PUNT GROC.pdf', 'RBG 200.pdf', 'RECIBOS.pdf', 'Repuestos.pdf',
                             'S100.pdf', 'VARIOS.pdf'
                           ].includes(sourceName));

    if (isDefaultSource) {
      Alert.alert(
        'No se puede eliminar',
        'Esta fuente es parte de los datos predeterminados de la aplicación y no puede eliminarse desde aquí.\n\nSolo puedes eliminar fuentes que hayas subido tú mismo.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${sourceName}"?\n\nSe eliminarán ${dataSources[sourceType].find(s => s.name === sourceName)?.count || 0} repuestos.\n\nLa página se recargará después de eliminar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              if (sourceType === 'excel') {
                // Eliminar de localStorage
                const userExcelData = JSON.parse(localStorage.getItem('excelData') || '[]');
                const filtered = userExcelData.filter(item => item.source !== sourceName);
                localStorage.setItem('excelData', JSON.stringify(filtered));
              } else if (sourceType === 'pdf') {
                // Eliminar de localStorage
                const userPdfData = JSON.parse(localStorage.getItem('pdfData') || '[]');
                const filtered = userPdfData.filter(item => item.source !== sourceName);
                localStorage.setItem('pdfData', JSON.stringify(filtered));
              }
              
              // Recargar la página para actualizar todo
              Alert.alert('Éxito', `Fuente "${sourceName}" eliminada. La página se recargará.`, [
                { text: 'OK', onPress: () => window.location.reload() }
              ]);
            } catch (error) {
              Alert.alert('Error', `No se pudo eliminar la fuente: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handlePasswordSubmit = () => {
    if (password === 'fujitsu') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      Alert.alert('Error', 'Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleFileSelection = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.pdf';
        input.multiple = true;
        
        input.onchange = async (event) => {
          const files = Array.from(event.target.files);
          if (files.length === 0) return;

          const fileList = files.map((file, index) => ({
            id: index,
            name: file.name,
            type: file.name.endsWith('.pdf') ? 'pdf' : 'excel',
            size: file.size,
            file: file,
          }));

          setSelectedFiles(fileList);
        };
        
        input.click();
      }
    } catch (error) {
      console.error('Error al seleccionar archivos:', error);
      Alert.alert('Error', `Error al seleccionar archivos: ${error.message}`);
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles(selectedFiles.filter(f => f.id !== fileId));
  };

  const processAllFiles = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Aviso', 'Por favor selecciona al menos un archivo');
      return;
    }

    try {
      setIsUploading(true);
      const stats = { excel: 0, pdfs: 0, images: 0 };

      for (const fileInfo of selectedFiles) {
        setUploadStatus(`Procesando ${fileInfo.name}...`);

        const arrayBuffer = await fileInfo.file.arrayBuffer();

        if (fileInfo.type === 'excel') {
          const result = await processExcelFile(arrayBuffer, fileInfo.name);
          stats.excel += result.count;
        } else if (fileInfo.type === 'pdf') {
          const result = await processPDFFile(arrayBuffer, fileInfo.name);
          stats.pdfs += result.count;
          stats.images += result.images;
        }
      }

      setProcessedData(stats);
      setUploadStatus('✅ ¡Todos los archivos procesados exitosamente!');

      // Guardar información de la última subida
      const uploadInfo = {
        date: new Date().toISOString(),
        excel: stats.excel,
        pdfs: stats.pdfs,
        images: stats.images,
        totalFiles: selectedFiles.length,
      };
      localStorage.setItem('lastUploadInfo', JSON.stringify(uploadInfo));

      setTimeout(() => {
        Alert.alert(
          'Éxito',
          `Archivos procesados:\n\n` +
          `📊 Repuestos Excel: ${stats.excel}\n` +
          `📄 Repuestos PDFs: ${stats.pdfs}\n` +
          `🖼️ Imágenes extraídas: ${stats.images}\n\n` +
          `Total: ${stats.excel + stats.pdfs} repuestos`,
          [{ text: 'OK', onPress: () => {
            setSelectedFiles([]);
            setIsUploading(false);
            setUploadStatus('');
            window.location.reload();
          }}]
        );
      }, 1500);

    } catch (error) {
      console.error('Error procesando archivos:', error);
      setIsUploading(false);
      setUploadStatus('');
      Alert.alert('Error', `No se pudieron procesar los archivos: ${error.message}`);
    }
  };

  const processExcelFile = async (arrayBuffer, filename) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error(`El archivo ${filename} está vacío`);
      }

      const keys = Object.keys(jsonData[0]);
      const codeColumn = keys.find(key => 
        key.toLowerCase().includes('cod') || 
        key.toLowerCase().includes('code') ||
        keys.indexOf(key) === 0
      ) || keys[0];

      const descColumn = keys.find(key => 
        key.toLowerCase().includes('desc') || 
        key.toLowerCase().includes('description') ||
        key.toLowerCase().includes('nombre') ||
        (keys.indexOf(key) === 1 && !key.toLowerCase().includes('cod'))
      ) || keys[1];

      const convertedData = jsonData.map((row, index) => {
        const code = String(row[codeColumn] || '').trim();
        const description = String(row[descColumn] || '').trim();
        
        return {
          code: code,
          description: description,
          source: filename,
        };
      }).filter(item => item.code && item.description);

      // Guardar en localStorage para persistencia
      const currentExcelData = JSON.parse(localStorage.getItem('excelData') || '[]');
      const updatedExcelData = [...currentExcelData, ...convertedData];
      localStorage.setItem('excelData', JSON.stringify(updatedExcelData));

      return { count: convertedData.length };
    } catch (error) {
      throw error;
    }
  };

  const processPDFFile = async (arrayBuffer, filename) => {
    try {
      // Usar pdf.js para extraer texto
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      if (!pdfjsLib) {
        throw new Error('PDF.js no está disponible');
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let allParts = [];
      let totalImages = 0;

      // Procesar cada página
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extraer texto
        const pageText = textContent.items.map(item => item.str).join(' ');
        const lines = pageText.split(/\n|\r/);

        // Buscar patrones de código y descripción
        const codePattern = /^([A-Z0-9][\w\-\.\/]{2,})\s+(.+)/;
        
        for (const line of lines) {
          const match = line.match(codePattern);
          if (match) {
            allParts.push({
              code: match[1].trim(),
              description: match[2].trim(),
              source: filename,
              page: pageNum,
            });
          }
        }

        // Contar imágenes en la página
        const ops = await page.getOperatorList();
        for (let i = 0; i < ops.fnArray.length; i++) {
          if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
            totalImages++;
          }
        }
      }

      // Guardar en localStorage
      const currentPdfData = JSON.parse(localStorage.getItem('pdfData') || '[]');
      const updatedPdfData = [...currentPdfData, ...allParts];
      localStorage.setItem('pdfData', JSON.stringify(updatedPdfData));

      return { count: allParts.length, images: totalImages };
    } catch (error) {
      console.error('Error procesando PDF:', error);
      // Si falla, intentar al menos guardar el nombre del archivo
      return { count: 0, images: 0 };
    }
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setPassword('');
    setUploadStatus('');
    setIsUploading(false);
    onDismiss();
  };

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={handleClose}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Content>
            {!isAuthenticated ? (
              // Pantalla de autenticación
              <View style={styles.authContainer}>
                <View style={styles.headerContainer}>
                  <Ionicons name="shield-checkmark" size={40} color="#6200ee" />
                  <Title style={styles.title}>Panel de Administración</Title>
                </View>
                
                <Paragraph style={styles.subtitle}>
                  Ingresa la contraseña para acceder
                </Paragraph>

                <TextInput
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  mode="outlined"
                  style={styles.input}
                  onSubmitEditing={handlePasswordSubmit}
                  autoFocus
                />

                <View style={styles.buttonContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={handleClose}
                    style={styles.button}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handlePasswordSubmit}
                    style={styles.button}
                    disabled={!password}
                  >
                    Acceder
                  </Button>
                </View>

                {lastUpload && (
                  <Card style={styles.lastUploadCard}>
                    <Card.Content>
                      <View style={styles.lastUploadHeader}>
                        <Ionicons name="time-outline" size={18} color="#6200ee" />
                        <Text style={styles.lastUploadTitle}>Última actualización</Text>
                      </View>
                      <Text style={styles.lastUploadDate}>
                        📅 {new Date(lastUpload.date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                      <View style={styles.lastUploadStats}>
                        <Text style={styles.lastUploadStat}>📊 {lastUpload.excel}</Text>
                        <Text style={styles.lastUploadStat}>📄 {lastUpload.pdfs}</Text>
                        <Text style={styles.lastUploadStat}>🖼️ {lastUpload.images}</Text>
                      </View>
                    </Card.Content>
                  </Card>
                )}
              </View>
            ) : (
              // Panel de administración
              <ScrollView style={styles.adminContainer}>
                <View style={styles.headerContainer}>
                  <Ionicons name="settings" size={48} color="#6200ee" />
                  <Title style={styles.title}>Panel de Administración</Title>
                </View>

                {/* Pestañas de navegación */}
                <SegmentedButtons
                  value={activeTab}
                  onValueChange={setActiveTab}
                  buttons={[
                    {
                      value: 'sources',
                      label: 'Gestionar Fuentes',
                      icon: 'database',
                    },
                    {
                      value: 'update',
                      label: 'Actualizar Datos',
                      icon: 'cloud-upload',
                    },
                  ]}
                  style={styles.tabButtons}
                />

                {/* Pestaña: Gestionar Fuentes */}
                {activeTab === 'sources' && (
                  <View style={styles.tabContent}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="database" size={24} color="#6200ee" />
                      <Text style={styles.sectionTitle}>Fuentes de Datos</Text>
                    </View>
                    
                    <Paragraph style={styles.sectionDescription}>
                      Activa, desactiva o elimina fuentes de datos para controlar qué archivos se incluyen en las búsquedas.
                    </Paragraph>

                    {/* Fuentes Excel */}
                    {dataSources.excel.length > 0 && (
                      <View style={styles.sourceTypeSection}>
                        <View style={styles.sourceTypeHeader}>
                          <Ionicons name="document-text" size={20} color="#217346" />
                          <Text style={styles.sourceTypeTitle}>Archivos Excel ({dataSources.excel.length})</Text>
                        </View>
                        {dataSources.excel.map((source, index) => (
                          <Card key={`excel-${index}`} style={styles.sourceCard}>
                            <Card.Content>
                              <View style={styles.sourceCardContent}>
                                <View style={styles.sourceMainInfo}>
                                  <Switch
                                    value={source.enabled}
                                    onValueChange={() => toggleSourceEnabled(source.name)}
                                    color="#217346"
                                  />
                                  <View style={styles.sourceTextInfo}>
                                    <Text style={[styles.sourceName, !source.enabled && styles.sourceDisabled]}>
                                      {source.name}
                                    </Text>
                                    <View style={styles.sourceMetadata}>
                                      <Chip
                                        icon="package-variant"
                                        style={[styles.statusChip, source.enabled ? styles.activeChip : styles.inactiveChip]}
                                        textStyle={styles.chipTextSmall}
                                      >
                                        {source.count} repuestos
                                      </Chip>
                                      <Chip
                                        icon={source.enabled ? 'check-circle' : 'close-circle'}
                                        style={[styles.statusChip, source.enabled ? styles.activeChip : styles.inactiveChip]}
                                        textStyle={styles.chipTextSmall}
                                      >
                                        {source.enabled ? 'Activa' : 'Desactivada'}
                                      </Chip>
                                    </View>
                                  </View>
                                </View>
                                <IconButton
                                  icon="delete"
                                  iconColor="#d32f2f"
                                  size={20}
                                  onPress={() => removeDataSource(source.name, 'excel')}
                                />
                              </View>
                            </Card.Content>
                          </Card>
                        ))}
                      </View>
                    )}

                    {/* Fuentes PDF */}
                    {dataSources.pdf.length > 0 && (
                      <View style={styles.sourceTypeSection}>
                        <View style={styles.sourceTypeHeader}>
                          <Ionicons name="document" size={20} color="#ff6f00" />
                          <Text style={styles.sourceTypeTitle}>Archivos PDF ({dataSources.pdf.length})</Text>
                        </View>
                        {dataSources.pdf.map((source, index) => (
                          <Card key={`pdf-${index}`} style={styles.sourceCard}>
                            <Card.Content>
                              <View style={styles.sourceCardContent}>
                                <View style={styles.sourceMainInfo}>
                                  <Switch
                                    value={source.enabled}
                                    onValueChange={() => toggleSourceEnabled(source.name)}
                                    color="#ff6f00"
                                  />
                                  <View style={styles.sourceTextInfo}>
                                    <Text style={[styles.sourceName, !source.enabled && styles.sourceDisabled]}>
                                      {source.name}
                                    </Text>
                                    <View style={styles.sourceMetadata}>
                                      <Chip
                                        icon="package-variant"
                                        style={[styles.statusChip, source.enabled ? styles.activeChip : styles.inactiveChip]}
                                        textStyle={styles.chipTextSmall}
                                      >
                                        {source.count} repuestos
                                      </Chip>
                                      <Chip
                                        icon={source.enabled ? 'check-circle' : 'close-circle'}
                                        style={[styles.statusChip, source.enabled ? styles.activeChip : styles.inactiveChip]}
                                        textStyle={styles.chipTextSmall}
                                      >
                                        {source.enabled ? 'Activa' : 'Desactivada'}
                                      </Chip>
                                    </View>
                                  </View>
                                </View>
                                <IconButton
                                  icon="delete"
                                  iconColor="#d32f2f"
                                  size={20}
                                  onPress={() => removeDataSource(source.name, 'pdf')}
                                />
                              </View>
                            </Card.Content>
                          </Card>
                        ))}
                      </View>
                    )}

                    {dataSources.excel.length === 0 && dataSources.pdf.length === 0 && (
                      <View style={styles.noSourcesContainer}>
                        <Ionicons name="folder-open-outline" size={48} color="#ccc" />
                        <Text style={styles.noSourcesText}>No hay fuentes de datos disponibles</Text>
                        <Text style={styles.noSourcesHint}>Ve a "Actualizar Datos" para añadir archivos</Text>
                      </View>
                    )}

                    <Card style={styles.infoCard}>
                      <Card.Content>
                        <View style={styles.infoCardHeader}>
                          <Ionicons name="information-circle" size={20} color="#6200ee" />
                          <Text style={styles.infoCardTitle}>Información</Text>
                        </View>
                        <Text style={styles.infoCardText}>
                          • Usa el switch para activar/desactivar fuentes{'\n'}
                          • Las fuentes desactivadas no aparecen en búsquedas{'\n'}
                          • Solo puedes eliminar fuentes que hayas subido{'\n'}
                          • Las fuentes predeterminadas no pueden eliminarse
                        </Text>
                      </Card.Content>
                    </Card>

                    {/* Botón para añadir nuevas fuentes */}
                    <Button
                      mode="contained"
                      onPress={() => setActiveTab('update')}
                      icon="plus-circle"
                      style={styles.addSourceButton}
                    >
                      Añadir Nuevas Fuentes
                    </Button>
                  </View>
                )}

                {/* Pestaña: Actualizar Datos */}
                {activeTab === 'update' && (
                  <View style={styles.tabContent}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="cloud-upload" size={24} color="#6200ee" />
                      <Text style={styles.sectionTitle}>Actualizar Base de Datos</Text>
                    </View>

                    <Paragraph style={styles.sectionDescription}>
                      Selecciona archivos Excel o PDF con repuestos para añadirlos a la base de datos.
                    </Paragraph>

                    {!isUploading && (
                      <View style={styles.uploadContainer}>
                        <Button
                          mode="contained"
                          onPress={handleFileSelection}
                          icon="file-multiple"
                          style={styles.uploadButton}
                        >
                          Seleccionar archivos
                        </Button>

                        <View style={styles.formatInfoContainer}>
                          <Chip icon="file-excel" style={styles.formatChip}>Excel (.xlsx, .xls)</Chip>
                          <Chip icon="file-pdf-box" style={styles.formatChip}>PDF con imágenes</Chip>
                        </View>

                        <Text style={styles.formatInfo}>
                          💡 Puedes seleccionar múltiples archivos a la vez
                        </Text>
                      </View>
                    )}

                        {selectedFiles.length > 0 && !isUploading && (
                      <View style={styles.filesListContainer}>
                        <Text style={styles.filesListTitle}>Archivos seleccionados ({selectedFiles.length}):</Text>
                        <View style={styles.filesScrollView}>
                          {selectedFiles.map((file) => (
                            <View key={file.id} style={styles.fileItem}>
                              <Ionicons 
                                name={file.type === 'pdf' ? 'document' : 'document-text'} 
                                size={24} 
                                color={file.type === 'pdf' ? '#ff6f00' : '#6200ee'}
                              />
                              <Text style={styles.fileName}>{file.name}</Text>
                              <Text style={styles.fileSize}>
                                {(file.size / 1024).toFixed(1)} KB
                              </Text>
                              <Button
                                mode="text"
                                onPress={() => removeFile(file.id)}
                                compact
                              >
                                ✕
                              </Button>
                            </View>
                          ))}
                        </View>

                        <Button
                          mode="contained"
                          onPress={processAllFiles}
                          icon="check-circle"
                          style={styles.processButton}
                        >
                          Procesar {selectedFiles.length} archivo(s)
                        </Button>
                      </View>
                    )}

                    {isUploading && (
                      <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="large" color="#6200ee" />
                        <Text style={styles.uploadStatus}>{uploadStatus}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Botón de cerrar */}
                <View style={styles.buttonContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={handleClose}
                    style={styles.button}
                    disabled={isUploading}
                  >
                    Cerrar
                  </Button>
                </View>
              </ScrollView>
            )}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    maxHeight: '90vh',
    maxWidth: 500,
    alignSelf: 'center',
  },
  authContainer: {
    padding: 16,
  },
  adminContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6200ee',
    fontSize: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  uploadContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  uploadButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  formatInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  uploadStatus: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    color: '#6200ee',
  },
  formatInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    marginBottom: 8,
  },
  formatChip: {
    margin: 4,
  },
  filesListContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
  },
  filesListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  filesScrollView: {
    maxHeight: 300,
  lastUploadCard: {
    marginTop: 16,
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 3,
    borderLeftColor: '#6200ee',
    elevation: 0,
  },
  lastUploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  lastUploadTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6200ee',
    marginLeft: 6,
  },
  lastUploadDate: {
    fontSize: 12,
    color: '#333',
    marginBottom: 6,
  },
  lastUploadStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  lastUploadStat: {
    fontSize: 11,
    color: '#666',
    marginHorizontal: 4,
  },
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
    elevation: 1,
  },
  fileName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  processButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  dataSourcesSection: {
    marginBottom: 20,
  },
  dataSourcesAccordion: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dataSourcesContent: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sourceTypeSection: {
    marginBottom: 20,
  },
  sourceTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  sourceTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6200ee',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceTextInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  sourceDisabled: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  sourceCount: {
    fontSize: 12,
    color: '#666',
  },
  noSourcesContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noSourcesText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  sourceInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  sourceInfoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  // Nuevos estilos para pestañas
  tabButtons: {
    marginTop: 16,
    marginBottom: 24,
  },
  tabContent: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  sourceCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  sourceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  statusChip: {
    height: 24,
  },
  chipTextSmall: {
    fontSize: 11,
  },
  activeChip: {
    backgroundColor: '#e8f5e9',
  },
  inactiveChip: {
    backgroundColor: '#ffebee',
  },
  noSourcesHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  infoCard: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  infoCardText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 22,
  },
  addSourceButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

export default AdminPanel;
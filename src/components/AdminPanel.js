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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as XLSX from 'xlsx';
import { searchService } from '../services/searchServiceUnified';

const AdminPanel = ({ visible, onDismiss }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processedData, setProcessedData] = useState({ excel: 0, pdfs: 0, images: 0 });
  const [lastUpload, setLastUpload] = useState(null);

  // Cargar información de la última subida al autenticarse
  useEffect(() => {
    if (isAuthenticated) {
      const lastUploadInfo = localStorage.getItem('lastUploadInfo');
      if (lastUploadInfo) {
        setLastUpload(JSON.parse(lastUploadInfo));
      }
    }
  }, [isAuthenticated]);

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
                  <Ionicons name="shield-checkmark" size={48} color="#6200ee" />
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
                {lastUpload && (
                  <Card style={styles.lastUploadCard}>
                    <Card.Content>
                      <View style={styles.lastUploadHeader}>
                        <Ionicons name="time-outline" size={20} color="#6200ee" />
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
                        <Text style={styles.lastUploadStat}>📊 Excel: {lastUpload.excel}</Text>
                        <Text style={styles.lastUploadStat}>📄 PDFs: {lastUpload.pdfs}</Text>
                        <Text style={styles.lastUploadStat}>🖼️ Imágenes: {lastUpload.images}</Text>
                      </View>
                    </Card.Content>
                  </Card>
                )}

                </View>
              </View>
            ) : (
              // Panel de administración
              <ScrollView style={styles.adminContainer}>
                <View style={styles.headerContainer}>
                  <Ionicons name="cloud-upload" size={48} color="#6200ee" />
                  <Title style={styles.title}>Actualizar Base de Datos</Title>
                </View>

                <Paragraph style={styles.subtitle}>
                  Selecciona archivos Excel o PDF con repuestos e imágenes
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
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    maxHeight: '85%',
  },
  authContainer: {
    padding: 20,
  },
  adminContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6200ee',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
    marginBottom: 16,
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  lastUploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lastUploadTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200ee',
    marginLeft: 6,
  },
  lastUploadDate: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
  },
  lastUploadStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  lastUploadStat: {
    fontSize: 12,
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
});

export default AdminPanel;
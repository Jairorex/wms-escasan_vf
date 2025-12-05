import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, TextInput, SafeAreaView 
} from 'react-native';
import { 
  Package, MapPin, CheckCircle, X, Play, Barcode, 
  ArrowRight, AlertTriangle, Check, Camera
} from 'lucide-react-native';
import api from '../api/axiosClient';
import Colors from '../constants/colors';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function TaskExecutionScreen({ route, navigation }) {
  const { taskId, taskType } = route.params; // taskType: 'PICK', 'PUTAWAY', 'PACK'
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estados para checking
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [scannedItems, setScannedItems] = useState([]);
  const [scanInput, setScanInput] = useState('');
  const [ubicacionValidada, setUbicacionValidada] = useState(false);
  const [checkInPhase, setCheckInPhase] = useState(true); // true = check-in ubicación, false = check-in producto
  const [showScanner, setShowScanner] = useState(false);
  const [scanningFor, setScanningFor] = useState(null); // 'ubicacion' o 'producto'

  useEffect(() => {
    fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      const taskData = response.data.data || response.data;
      setTask(taskData);
      
      // Manejar diferentes estructuras de detalles
      const detalles = taskData.detalles || taskData.detalleTareas || taskData.detalle_tareas || [];
      console.log('📦 Tarea recibida:', taskData);
      console.log('📦 Detalles encontrados:', detalles);
    } catch (error) {
      console.error('Error al cargar tarea:', error);
      Alert.alert('Error', 'No se pudo cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await api.post(`/tasks/${taskId}/start`);
      Alert.alert('Éxito', 'Tarea iniciada - Comienza el checking');
      fetchTaskDetail();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo iniciar la tarea');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateScan = async (tipoEscaneo, valor) => {
    try {
      const response = await api.post('/tasks/validate-scan', {
        tarea_id: taskId,
        tipo_escaneo: tipoEscaneo,
        valor: valor,
        cantidad: null,
        usuario_id: null
      });

      if (response.data.status === 'success') {
        return { success: true, message: response.data.message, data: response.data.data };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al validar escaneo' 
      };
    }
  };

  // Manejar escaneo desde la cámara
  const handleCameraScan = (scannedCode) => {
    setScanInput(scannedCode);
    setShowScanner(false);
    
    // Procesar el escaneo según el tipo
    if (scanningFor === 'ubicacion') {
      handleScanUbicacion(scannedCode);
    } else if (scanningFor === 'producto') {
      handleScanProducto(scannedCode);
    }
  };

  const handleScanUbicacion = async (scannedValue = null) => {
    const codeToCheck = scannedValue || scanInput.trim();
    
    if (!codeToCheck) {
      Alert.alert('Error', 'Ingresa un código de ubicación');
      return;
    }

    const detalles = task?.detalles || task?.detalleTareas || task?.detalle_tareas || [];
    const currentItem = detalles[currentItemIndex];
    
    if (!currentItem) {
      Alert.alert('Error', 'No hay más items para procesar');
      return;
    }

    // Para PUTAWAY, la ubicación esperada es ubicacion_destino
    // Para PICK, la ubicación esperada es ubicacion_origen
    const expectedLocation = taskType === 'PUTAWAY' 
      ? (currentItem.ubicacion_destino?.codigo || currentItem.ubicacion?.codigo)
      : (currentItem.ubicacion_origen?.codigo || currentItem.ubicacion?.codigo);
    
    // Normalizar códigos (trim, sin espacios extra, case insensitive)
    const normalizedCode = codeToCheck.trim().toUpperCase();
    const normalizedExpected = (expectedLocation || '').trim().toUpperCase();
    
    console.log('🔍 Validando ubicación:', {
      codeToCheck: normalizedCode,
      expected: normalizedExpected,
      originalCode: codeToCheck,
      originalExpected: expectedLocation
    });
    
    if (normalizedCode !== normalizedExpected) {
      Alert.alert('Error', `Ubicación incorrecta. Esperada: ${expectedLocation || 'N/A'}`);
      return;
    }

    // Validar con el backend
    const result = await handleValidateScan('ubicacion', codeToCheck);
    
    if (result.success) {
      setUbicacionValidada(true);
      setCheckInPhase(false); // Cambiar a fase de producto
      Alert.alert('Éxito', 'Ubicación validada correctamente');
      setScanInput('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleScanProducto = async (scannedValue = null) => {
    const codeToCheck = scannedValue || scanInput.trim();
    
    if (!codeToCheck) {
      Alert.alert('Error', 'Ingresa un código de producto o lote');
      return;
    }

    if (!ubicacionValidada) {
      Alert.alert('Error', 'Primero debes validar la ubicación');
      return;
    }

    const detalles = task?.detalles || task?.detalleTareas || task?.detalle_tareas || [];
    const currentItem = detalles[currentItemIndex];
    
    if (!currentItem) {
      Alert.alert('Error', 'No hay más items para procesar');
      return;
    }

    const expectedCode = currentItem.lote?.lote_codigo || currentItem.producto?.sku;
    
    // Validar con el backend
    const result = await handleValidateScan('lote', codeToCheck);
    
    if (result.success) {
      // Agregar a items escaneados
      const newScannedItem = {
        ...currentItem,
        scanned: true,
        scannedAt: new Date().toISOString()
      };
      
      setScannedItems([...scannedItems, newScannedItem]);
      setUbicacionValidada(false);
      setCheckInPhase(true);
      setScanInput('');
      
      // Si hay más items, avanzar al siguiente
      if (currentItemIndex < detalles.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
        Alert.alert('Éxito', 'Producto validado correctamente');
      } else {
        Alert.alert('Éxito', 'Todos los productos han sido validados');
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleComplete = async () => {
    // Validar que todos los items estén escaneados
    const detalles = task?.detalles || task?.detalleTareas || task?.detalle_tareas || [];
    const allItemsScanned = scannedItems.length === detalles.length && detalles.length > 0;
    
    if (!allItemsScanned) {
      Alert.alert(
        'Tarea incompleta', 
        `Faltan ${detalles.length - scannedItems.length} producto(s) por escanear. Debes completar todos los items antes de finalizar la tarea.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.post(`/tasks/${taskId}/complete`);
      const responseData = response.data || response;
      console.log('📦 Respuesta completa del backend:', responseData);
      
      // El backend devuelve { success: true, message: ..., packing_task_id: ..., data: ... }
      const packingTaskId = responseData?.packing_task_id || responseData?.data?.packing_task_id;
      console.log('📦 packing_task_id extraído:', packingTaskId);
      
      Alert.alert('Éxito', 'Tarea completada exitosamente', [
        {
          text: 'OK',
          onPress: () => {
            // Si es PICK y se creó una tarea de PACK, navegar a ella
            if (taskType === 'PICK' && packingTaskId) {
              navigation.replace('TaskExecution', {
                taskId: packingTaskId,
                taskType: 'PACK'
              });
            } else {
              navigation.goBack();
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo completar la tarea');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.escasan.green.main} />
          <Text style={styles.loadingText}>Cargando tarea...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <AlertTriangle size={48} color={Colors.escasan.orange.main} />
          <Text style={styles.errorText}>Tarea no encontrada</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const detalles = task.detalles || task.detalleTareas || task.detalle_tareas || [];
  const currentItem = detalles[currentItemIndex];
  const allItemsScanned = scannedItems.length === detalles.length && detalles.length > 0;
  const canStart = task.estado === 'CREADA' || task.estado === 'ASIGNADA';
  const canResume = task.estado === 'EN_CURSO'; // Puede reanudar si está en curso
  const canComplete = task.estado === 'EN_CURSO' && allItemsScanned;

  // Si la tarea no está iniciada, mostrar botón de iniciar
  // Si está EN_CURSO pero no hay progreso, también mostrar botón de iniciar/reanudar
  if (canStart || (canResume && scannedItems.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.taskType}>{task.tipo_tarea}</Text>
            <Text style={styles.taskId}>Tarea #{task.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#ff980020' }]}>
              <Text style={[styles.statusText, { color: '#ff9800' }]}>
                {task.estado}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información</Text>
            <Text style={styles.infoText}>
              Esta tarea tiene {detalles.length} producto(s) para procesar.
            </Text>
            {canResume && scannedItems.length === 0 && (
              <Text style={[styles.infoText, { color: Colors.escasan.orange.main, marginTop: 8 }]}>
                Puedes reanudar esta tarea desde el inicio.
              </Text>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStart}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Play size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {canResume ? 'Reanudar Tarea' : 'Iniciar Tarea'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Scanner Modal */}
        <BarcodeScannerModal
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleCameraScan}
          title={scanningFor === 'ubicacion' ? 'Escanea el código de ubicación' : 'Escanea el código del producto'}
        />
      </SafeAreaView>
    );
  }

  // Si no hay detalles, mostrar mensaje
  if (!detalles || detalles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <AlertTriangle size={48} color={Colors.escasan.orange.main} />
          <Text style={styles.errorText}>Tarea sin detalles</Text>
          <Text style={styles.errorSubtext}>
            Esta tarea no tiene productos asignados para procesar.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.taskType}>{task.tipo_tarea}</Text>
          <Text style={styles.taskId}>Tarea #{task.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#2196f320' }]}>
            <Text style={[styles.statusText, { color: '#2196f3' }]}>
              {task.estado}
            </Text>
          </View>
        </View>

        {/* Panel de Checking */}
        {task.estado === 'EN_CURSO' && currentItem && (
          <View style={styles.checkingSection}>
            <Text style={styles.checkingTitle}>
              Producto {currentItemIndex + 1} de {detalles.length}
            </Text>

            {/* Ubicación destacada */}
            <View style={styles.locationCard}>
              <MapPin size={32} color={Colors.escasan.green.main} />
              <Text style={styles.locationLabel}>UBICACIÓN</Text>
              <Text style={styles.locationCode}>
                {currentItem.ubicacion_origen?.codigo || currentItem.ubicacion?.codigo || 'N/A'}
              </Text>
            </View>

            {/* Detalles del producto */}
            <View style={styles.productCard}>
              <View style={styles.productRow}>
                <Package size={20} color="#666" />
                <Text style={styles.productName}>
                  {currentItem.lote?.producto?.nombre || currentItem.producto?.nombre || 'Producto'}
                </Text>
              </View>
              <View style={styles.productRow}>
                <Text style={styles.productLabel}>SKU: </Text>
                <Text style={styles.productValue}>
                  {currentItem.lote?.producto?.sku || currentItem.producto?.sku || 'N/A'}
                </Text>
              </View>
              <View style={styles.productRow}>
                <Text style={styles.productLabel}>Lote: </Text>
                <Text style={styles.productValue}>
                  {currentItem.lote?.lote_codigo || 'N/A'}
                </Text>
              </View>
              <View style={styles.productRow}>
                <Text style={styles.productLabel}>Cantidad: </Text>
                <Text style={styles.productValue}>
                  {currentItem.cantidad_solicitada}
                </Text>
              </View>
            </View>

            {/* Input de escaneo */}
            <View style={styles.scanSection}>
              <Text style={styles.scanLabel}>
                {checkInPhase ? 'Escanea la ubicación' : 'Escanea el producto/lote'}
              </Text>
              <View style={styles.scanInputContainer}>
                <TextInput
                  style={styles.scanInput}
                  value={scanInput}
                  onChangeText={setScanInput}
                  placeholder="Código de barras..."
                  autoFocus
                  onSubmitEditing={checkInPhase ? handleScanUbicacion : handleScanProducto}
                />
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => {
                    const scanType = checkInPhase ? 'ubicacion' : 'producto';
                    console.log('📷 Botón cámara presionado, tipo:', scanType);
                    setScanningFor(scanType);
                    setShowScanner(true);
                    console.log('📷 showScanner actualizado a:', true);
                  }}
                  title="Usar cámara"
                >
                  <Camera size={24} color="#007bff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.scanButton, checkInPhase ? styles.scanButtonLocation : styles.scanButtonProduct]}
                onPress={checkInPhase ? handleScanUbicacion : handleScanProducto}
              >
                <Barcode size={20} color="#fff" />
                <Text style={styles.scanButtonText}>
                  {checkInPhase ? 'Validar Ubicación' : 'Validar Producto'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progreso */}
            <View style={styles.progressSection}>
              <Text style={styles.progressText}>
                Progreso: {scannedItems.length} / {detalles.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(scannedItems.length / detalles.length) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Lista de productos */}
        {detalles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos ({detalles.length})</Text>
            {detalles.slice(0, 5).map((detalle, index) => (
              <View key={index} style={styles.detailCard}>
                <Text style={styles.detailText}>
                  {detalle.lote?.producto?.nombre || 'Producto'} - 
                  Lote: {detalle.lote?.lote_codigo || 'N/A'}
                </Text>
                {scannedItems.find(item => item.id === detalle.id) && (
                  <CheckCircle size={16} color={Colors.escasan.green.main} />
                )}
              </View>
            ))}
            {detalles.length > 5 && (
              <Text style={styles.moreText}>... y {detalles.length - 5} más</Text>
            )}
          </View>
        )}

        {/* Botón de completar - solo si todos los items están escaneados */}
        {task.estado === 'EN_CURSO' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.completeButton,
                !allItemsScanned && styles.disabledButton
              ]}
              onPress={handleComplete}
              disabled={actionLoading || !allItemsScanned}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {taskType === 'PICK' ? 'Completar y Pasar a Packing' : 'Completar Tarea'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {!allItemsScanned && (
              <Text style={styles.warningText}>
                Progreso: {scannedItems.length} / {detalles.length} productos escaneados
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.escasan.green.main,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  taskType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  taskId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  checkingSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  checkingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: Colors.escasan.green.main + '10',
    borderWidth: 2,
    borderColor: Colors.escasan.green.main,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.escasan.green.main,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  locationCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.escasan.green.main,
  },
  productCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  productLabel: {
    fontSize: 14,
    color: '#666',
  },
  productValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  scanSection: {
    marginBottom: 20,
  },
  scanLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scanInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  scanInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  cameraButton: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonLocation: {
    backgroundColor: Colors.escasan.green.main,
  },
  scanButtonProduct: {
    backgroundColor: Colors.confirm.main,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.escasan.green.main,
  },
  detailCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionsContainer: {
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  startButton: {
    backgroundColor: Colors.escasan.green.main,
  },
  completeButton: {
    backgroundColor: Colors.escasan.green.main,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#ccc',
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.escasan.orange.main,
    textAlign: 'center',
    fontWeight: '500',
  },
});


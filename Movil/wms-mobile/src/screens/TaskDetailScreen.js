import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ClipboardList, Package, MapPin, Clock, CheckCircle, Play, X } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data.data || response.data);
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
      Alert.alert('Éxito', 'Tarea iniciada');
      fetchTaskDetail();
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la tarea');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await api.post(`/tasks/${taskId}/complete`);
      Alert.alert('Éxito', 'Tarea completada');
      fetchTaskDetail();
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la tarea');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centerContainer}>
        <Text>Tarea no encontrada</Text>
      </View>
    );
  }

  const canStart = task.estado === 'CREADA' || task.estado === 'ASIGNADA';
  const canComplete = task.estado === 'EN_CURSO';

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.taskType}>{task.tipo_tarea}</Text>
        <Text style={styles.taskId}>Tarea #{task.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(task.estado) + '20' }]}>
          <Text style={[styles.statusText, { color: getEstadoColor(task.estado) }]}>
            {task.estado}
          </Text>
        </View>
      </View>

      {/* Información General */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <InfoRow icon={<Clock size={18} color="#666" />} label="Fecha Creación" value={task.fecha_creacion ? new Date(task.fecha_creacion).toLocaleString('es-ES') : 'N/A'} />
        {task.fecha_inicio && (
          <InfoRow icon={<Play size={18} color="#666" />} label="Fecha Inicio" value={new Date(task.fecha_inicio).toLocaleString('es-ES')} />
        )}
        {task.fecha_fin && (
          <InfoRow icon={<CheckCircle size={18} color="#666" />} label="Fecha Fin" value={new Date(task.fecha_fin).toLocaleString('es-ES')} />
        )}
        {task.prioridad && (
          <InfoRow icon={<ClipboardList size={18} color="#666" />} label="Prioridad" value={task.prioridad.toString()} />
        )}
      </View>

      {/* Detalles de Tarea */}
      {task.detalle_tarea && task.detalle_tarea.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {task.detalle_tarea.map((detalle, index) => (
            <View key={index} style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Package size={18} color="#007bff" />
                <Text style={styles.detailText}>
                  {detalle.lote?.producto?.nombre || 'Producto'} ({detalle.lote?.producto?.sku || 'N/A'})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lote: </Text>
                <Text style={styles.detailValue}>{detalle.lote?.lote_codigo || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cantidad: </Text>
                <Text style={styles.detailValue}>
                  {detalle.cantidad_completada || 0} / {detalle.cantidad_solicitada}
                </Text>
              </View>
              {detalle.ubicacion_origen && (
                <View style={styles.detailRow}>
                  <MapPin size={18} color="#666" />
                  <Text style={styles.detailText}>Origen: {detalle.ubicacion_origen?.codigo || 'N/A'}</Text>
                </View>
              )}
              {detalle.ubicacion_destino && (
                <View style={styles.detailRow}>
                  <MapPin size={18} color="#666" />
                  <Text style={styles.detailText}>Destino: {detalle.ubicacion_destino?.codigo || 'N/A'}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Acciones */}
      <View style={styles.actionsContainer}>
        {canStart && (
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
                <Text style={styles.actionButtonText}>Iniciar Tarea</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {canComplete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Completar Tarea</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function getEstadoColor(estado) {
  switch (estado) {
    case 'CREADA':
      return '#ff9800';
    case 'EN_CURSO':
      return '#2196f3';
    case 'COMPLETADA':
      return '#4caf50';
    default:
      return '#757575';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    width: 30,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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
    backgroundColor: '#2196f3',
  },
  completeButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { ClipboardList, User, Plus, CheckCircle } from 'lucide-react-native';
import api from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

export default function TaskAssignmentScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOperarios, setShowOperarios] = useState(null);

  useEffect(() => {
    fetchTasks();
    if (userInfo?.rol?.toLowerCase() === 'supervisor') {
      fetchOperarios();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const params = { estado: 'CREADA' };
      const response = await api.get('/tasks', { params });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOperarios = async () => {
    try {
      // Obtener todos los usuarios con rol de operario
      const response = await api.get('/usuarios', { 
        params: { 
          search: '',
          // Filtrar por rol de operario - el backend debería manejar esto
        } 
      });
      
      // Filtrar solo los operarios del response
      const allUsers = response.data.data || [];
      const operariosList = allUsers.filter(user => {
        const rolNombre = user.rol?.nombre || user.rol_nombre || '';
        return rolNombre.toLowerCase().includes('operario');
      });
      
      setOperarios(operariosList);
    } catch (error) {
      console.error('Error al cargar operarios:', error);
      // Fallback: intentar obtener operarios del supervisor
      try {
        const fallbackResponse = await api.get(`/supervisores/${userInfo.id}/operarios`);
        const operariosData = fallbackResponse.data.data?.operarios || fallbackResponse.data.data || [];
        setOperarios(operariosData);
      } catch (fallbackError) {
        console.error('Error al cargar operarios del supervisor:', fallbackError);
        Alert.alert('Error', 'No se pudieron cargar los operarios');
      }
    }
  };

  const handleAssign = async (taskId, operarioId) => {
    try {
      // Usar el endpoint específico de asignación
      const response = await api.post(`/tasks/${taskId}/assign`, { 
        usuario_id: operarioId 
      });
      
      if (response.data.success) {
        Alert.alert('Éxito', 'Tarea asignada correctamente');
        fetchTasks();
        setShowOperarios(null);
      } else {
        Alert.alert('Error', response.data.message || 'No se pudo asignar la tarea');
      }
    } catch (error) {
      console.error('Error al asignar tarea:', error);
      const errorMessage = error.response?.data?.message || error.message || 'No se pudo asignar la tarea';
      Alert.alert('Error', errorMessage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskType}>{item.tipo_tarea}</Text>
          <Text style={styles.taskId}>Tarea #{item.id}</Text>
        </View>
        {item.prioridad && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>P: {item.prioridad}</Text>
          </View>
        )}
      </View>

      {showOperarios === item.id ? (
        <View style={styles.operariosContainer}>
          <Text style={styles.operariosTitle}>Asignar a:</Text>
          {operarios.length > 0 ? (
            operarios.map((operario) => (
              <TouchableOpacity
                key={operario.id}
                style={styles.operarioButton}
                onPress={() => handleAssign(item.id, operario.id)}
              >
                <User size={18} color="#007bff" />
                <Text style={styles.operarioName}>
                  {operario.nombre || operario.usuario || `Operario #${operario.id}`}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noOperariosText}>No hay operarios asignados</Text>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowOperarios(null)}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => setShowOperarios(item.id)}
        >
          <Plus size={18} color="#007bff" />
          <Text style={styles.assignButtonText}>Asignar Operario</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay tareas pendientes de asignar</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 10 },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  taskId: {
    fontSize: 12,
    color: '#999',
  },
  priorityBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  assignButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
  operariosContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  operariosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  operarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  operarioName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  noOperariosContainer: {
    padding: 12,
    alignItems: 'center',
  },
  noOperariosText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  noOperariosSubtext: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 8,
    padding: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});


import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { ClipboardList, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import api from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';
import Colors from '../constants/colors';

export default function TasksListScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pendientes, en_curso, completadas

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.estado = filter === 'pendientes' ? 'CREADA' : filter === 'en_curso' ? 'EN_CURSO' : 'COMPLETADA';
      }
      
      // Si es operario, solo sus tareas
      if (userInfo?.rol?.toLowerCase() === 'operario') {
        params.asignada_a_usuario_id = userInfo.id;
      }
      
      const response = await api.get('/tasks', { params });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'CREADA':
        return Colors.escasan.orange.main;
      case 'EN_CURSO':
        return Colors.confirm.main;
      case 'COMPLETADA':
        return Colors.escasan.green.main;
      default:
        return '#757575';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'CREADA':
        return <Clock size={20} color={Colors.escasan.orange.main} />;
      case 'EN_CURSO':
        return <AlertCircle size={20} color={Colors.confirm.main} />;
      case 'COMPLETADA':
        return <CheckCircle size={20} color={Colors.escasan.green.main} />;
      default:
        return <ClipboardList size={20} color="#757575" />;
    }
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskType}>{item.tipo_tarea}</Text>
          <Text style={styles.taskId}>#{item.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
          {getEstadoIcon(item.estado)}
          <Text style={[styles.statusText, { color: getEstadoColor(item.estado) }]}>
            {item.estado}
          </Text>
        </View>
      </View>
      
      {item.prioridad && (
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>Prioridad: {item.prioridad}</Text>
        </View>
      )}
      
      {item.fecha_creacion && (
        <Text style={styles.dateText}>
          Creada: {new Date(item.fecha_creacion).toLocaleDateString('es-ES')}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.escasan.green.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pendientes' && styles.filterButtonActive]}
          onPress={() => setFilter('pendientes')}
        >
          <Text style={[styles.filterText, filter === 'pendientes' && styles.filterTextActive]}>Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'en_curso' && styles.filterButtonActive]}
          onPress={() => setFilter('en_curso')}
        >
          <Text style={[styles.filterText, filter === 'en_curso' && styles.filterTextActive]}>En Curso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completadas' && styles.filterButtonActive]}
          onPress={() => setFilter('completadas')}
        >
          <Text style={[styles.filterText, filter === 'completadas' && styles.filterTextActive]}>Completadas</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de tareas */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay tareas disponibles</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 20,
    marginTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.escasan.green.main,
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
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
    marginBottom: 10,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
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


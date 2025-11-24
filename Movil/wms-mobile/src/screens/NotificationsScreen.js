import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react-native';
import api from '../api/axiosClient';

export default function NotificationsScreen() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('PENDIENTE'); // PENDIENTE, RESUELTA, all

  useEffect(() => {
    fetchAlertas();
  }, [filter]);

  const fetchAlertas = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.estado = filter;
      }
      const response = await api.get('/alertas', { params });
      setAlertas(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolve = async (alertaId) => {
    try {
      await api.post(`/alertas/${alertaId}/resolver`);
      fetchAlertas();
    } catch (error) {
      console.error('Error al resolver alerta:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlertas();
  };

  const getNivelIcon = (nivel) => {
    switch (nivel) {
      case 'ALTO':
        return <AlertCircle size={20} color="#f44336" />;
      case 'MEDIO':
        return <AlertTriangle size={20} color="#ff9800" />;
      case 'BAJO':
        return <Info size={20} color="#2196f3" />;
      default:
        return <Bell size={20} color="#757575" />;
    }
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case 'ALTO':
        return '#f44336';
      case 'MEDIO':
        return '#ff9800';
      case 'BAJO':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const renderAlerta = ({ item }) => (
    <View style={[styles.alertaCard, { borderLeftColor: getNivelColor(item.nivel_riesgo) }]}>
      <View style={styles.alertaHeader}>
        <View style={styles.alertaIcon}>{getNivelIcon(item.nivel_riesgo)}</View>
        <View style={styles.alertaInfo}>
          <Text style={styles.alertaTipo}>{item.tipo}</Text>
          <Text style={styles.alertaDescripcion}>{item.descripcion}</Text>
        </View>
      </View>
      
      <View style={styles.alertaFooter}>
        <Text style={styles.alertaFecha}>
          {item.fecha_alerta ? new Date(item.fecha_alerta).toLocaleString('es-ES') : 'N/A'}
        </Text>
        {item.estado === 'PENDIENTE' && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => handleResolve(item.id)}
          >
            <CheckCircle size={16} color="#4caf50" />
            <Text style={styles.resolveText}>Resolver</Text>
          </TouchableOpacity>
        )}
      </View>
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
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'PENDIENTE' && styles.filterButtonActive]}
          onPress={() => setFilter('PENDIENTE')}
        >
          <Text style={[styles.filterText, filter === 'PENDIENTE' && styles.filterTextActive]}>Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'RESUELTA' && styles.filterButtonActive]}
          onPress={() => setFilter('RESUELTA')}
        >
          <Text style={[styles.filterText, filter === 'RESUELTA' && styles.filterTextActive]}>Resueltas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todas</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={alertas}
        renderItem={renderAlerta}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay notificaciones</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filtersContainer: {
    flexDirection: 'row',
    padding: 10,
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
    backgroundColor: '#007bff',
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
  alertaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertaHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  alertaIcon: {
    marginRight: 12,
  },
  alertaInfo: {
    flex: 1,
  },
  alertaTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alertaDescripcion: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  alertaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  alertaFecha: {
    fontSize: 12,
    color: '#999',
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  resolveText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
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


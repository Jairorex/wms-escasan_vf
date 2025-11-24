import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { User, Search, UserPlus, CheckCircle, X } from 'lucide-react-native';
import api from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

export default function OperatorsManagementScreen({ navigation }) {
  const { userInfo } = useContext(AuthContext);
  const [operarios, setOperarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOperarios();
  }, []);

  const fetchOperarios = async () => {
    try {
      const params = { rol: 'operario' };
      if (userInfo?.rol?.toLowerCase() === 'supervisor') {
        // Solo operarios asignados al supervisor
        const response = await api.get(`/supervisores/${userInfo.id}/operarios`);
        setOperarios(response.data.data || []);
      } else {
        // Admin ve todos los operarios
        const response = await api.get('/usuarios', { params });
        setOperarios(response.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar operarios:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssign = async (operarioId) => {
    try {
      if (userInfo?.rol?.toLowerCase() === 'supervisor') {
        await api.post(`/supervisores/${userInfo.id}/operarios/${operarioId}`);
        Alert.alert('Éxito', 'Operario asignado correctamente');
        fetchOperarios();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el operario');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOperarios();
  };

  const filteredOperarios = operarios.filter(op =>
    op.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    op.usuario?.toLowerCase().includes(search.toLowerCase())
  );

  const renderOperario = ({ item }) => (
    <View style={styles.operarioCard}>
      <View style={styles.operarioHeader}>
        <View style={styles.iconContainer}>
          <User size={24} color="#007bff" />
        </View>
        <View style={styles.operarioInfo}>
          <Text style={styles.operarioName}>{item.nombre}</Text>
          <Text style={styles.operarioUser}>@{item.usuario}</Text>
        </View>
        {item.supervisor_id && (
          <View style={styles.assignedBadge}>
            <CheckCircle size={16} color="#4caf50" />
            <Text style={styles.assignedText}>Asignado</Text>
          </View>
        )}
      </View>
      
      {userInfo?.rol?.toLowerCase() === 'supervisor' && !item.supervisor_id && (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => handleAssign(item.id)}
        >
          <UserPlus size={18} color="#007bff" />
          <Text style={styles.assignButtonText}>Asignar a mí</Text>
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
      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar operario..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={filteredOperarios}
        renderItem={renderOperario}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={48} color="#ccc" />
            <Text style={styles.emptyText}>No hay operarios disponibles</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContainer: { padding: 10 },
  operarioCard: {
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
  operarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  operarioInfo: {
    flex: 1,
  },
  operarioName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  operarioUser: {
    fontSize: 14,
    color: '#999',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  assignedText: {
    fontSize: 12,
    color: '#4caf50',
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


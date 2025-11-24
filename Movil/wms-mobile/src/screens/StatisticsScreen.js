import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { BarChart3, TrendingUp, Clock, CheckCircle, Users } from 'lucide-react-native';
import api from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext';

export default function StatisticsScreen() {
  const { userInfo } = useContext(AuthContext);
  const [kpis, setKpis] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // KPIs de tareas
      const kpisResponse = await api.get('/tareas/kpis');
      setKpis(kpisResponse.data.data || {});

      // Estadísticas de supervisor (si es supervisor)
      if (userInfo?.rol?.toLowerCase() === 'supervisor') {
        const statsResponse = await api.get(`/supervisores/stats`);
        setStats(statsResponse.data.data || {});
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* KPIs Generales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KPIs de Tareas</Text>
        <View style={styles.kpiGrid}>
          <KpiCard
            icon={<CheckCircle size={24} color="#4caf50" />}
            label="Completadas"
            value={kpis?.tareas_completadas || 0}
            color="#4caf50"
          />
          <KpiCard
            icon={<Clock size={24} color="#ff9800" />}
            label="En Curso"
            value={kpis?.tareas_en_curso || 0}
            color="#ff9800"
          />
          <KpiCard
            icon={<TrendingUp size={24} color="#2196f3" />}
            label="Tiempo Promedio"
            value={kpis?.tiempo_promedio_minutos ? `${Math.round(kpis.tiempo_promedio_minutos)} min` : '0 min'}
            color="#2196f3"
          />
          <KpiCard
            icon={<BarChart3 size={24} color="#9c27b0" />}
            label="Productividad"
            value={kpis?.productividad_diaria || 0}
            color="#9c27b0"
          />
        </View>
      </View>

      {/* Estadísticas de Supervisor */}
      {userInfo?.rol?.toLowerCase() === 'supervisor' && stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Operarios</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Users size={20} color="#007bff" />
              <Text style={styles.statLabel}>Total Operarios: </Text>
              <Text style={styles.statValue}>{stats.total_operarios || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <CheckCircle size={20} color="#4caf50" />
              <Text style={styles.statLabel}>Tareas Completadas: </Text>
              <Text style={styles.statValue}>{stats.tareas_completadas || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Clock size={20} color="#ff9800" />
              <Text style={styles.statLabel}>Tareas Pendientes: </Text>
              <Text style={styles.statValue}>{stats.tareas_pendientes || 0}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function KpiCard({ icon, label, value, color }) {
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={styles.kpiIcon}>{icon}</View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  kpiIcon: {
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});


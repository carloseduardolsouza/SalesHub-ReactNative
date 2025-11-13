import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Filter, X } from 'lucide-react-native';

export const IndustryFilter = ({ industrias, selectedIndustria, onSelectIndustria, productCount }) => {
  if (!industrias || industrias.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.filterContainer}>
      <View style={styles.filterHeader}>
        <Filter size={18} color="#007AFF" />
        <Text style={styles.filterTitle}>Filtrar por Indústria</Text>
        {selectedIndustria && (
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={() => onSelectIndustria(null)}
          >
            <X size={16} color="#f44336" />
            <Text style={styles.clearFilterText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedIndustria && styles.filterChipActive
          ]}
          onPress={() => onSelectIndustria(null)}
        >
          <Text style={[
            styles.filterChipText,
            !selectedIndustria && styles.filterChipTextActive
          ]}>
            Todas ({productCount.total})
          </Text>
        </TouchableOpacity>

        {industrias.map((industria) => {
          const count = productCount.byIndustry[industria.nome] || 0;
          const isSelected = selectedIndustria === industria.nome;
          
          return (
            <TouchableOpacity
              key={industria.id ?? industria.nome}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipActive
              ]}
              onPress={() => onSelectIndustria(industria.nome)}
            >
              <Text style={[
                styles.filterChipText,
                isSelected && styles.filterChipTextActive
              ]}>
                {industria.nome} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clearFilterText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 4,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
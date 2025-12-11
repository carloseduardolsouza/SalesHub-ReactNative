import React, { memo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getStatusText } from '../utils/statusHelpers';

const statusOptions = ['Todos', 'pendente', 'processando', 'concluido', 'cancelado'];

const SearchAndFilters = memo(({ searchText, onSearchChange, selectedStatus, onStatusChange }) => (
  <View style={styles.controls}>
    <TextInput
      style={styles.searchInput}
      placeholder="Buscar por cliente ou número do pedido..."
      value={searchText}
      onChangeText={onSearchChange}
    />
    <View style={styles.filterContainer}>
      <Picker
        selectedValue={selectedStatus}
        style={styles.picker}
        onValueChange={onStatusChange}
      >
        {statusOptions.map(status => (
          <Picker.Item key={status} label={getStatusText(status)} value={status} />
        ))}
      </Picker>
    </View>
  </View>
));

SearchAndFilters.displayName = 'SearchAndFilters';

const styles = StyleSheet.create({
  controls: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  filterContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
});

export default SearchAndFilters;
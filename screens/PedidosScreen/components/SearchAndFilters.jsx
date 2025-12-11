import React, { memo } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const SearchAndFilters = memo(({ searchText, onSearchChange, selectedStatus, onStatusChange }) => (
  <View style={styles.controls}>
    <TextInput
      style={styles.searchInput}
      placeholder="Buscar por cliente ou número do pedido..."
      value={searchText}
      onChangeText={onSearchChange}
    />
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
});

export default SearchAndFilters;
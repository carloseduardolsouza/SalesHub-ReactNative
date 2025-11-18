import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Filter } from 'lucide-react-native';

const SearchBar = ({ searchText, onSearchChange, onFilterPress }) => (
  <View style={styles.controls}>
    <View style={styles.searchContainer}>
      <Search size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nome, razão social ou CNPJ..."
        value={searchText}
        onChangeText={onSearchChange}
        placeholderTextColor="#999"
      />
    </View>

    <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
      <Filter size={20} color="#007AFF" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
});

export default SearchBar;
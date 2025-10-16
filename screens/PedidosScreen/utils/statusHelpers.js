export const getStatusColor = (status) => {
  switch (status) {
    case 'pendente': return '#FF9800';
    case 'processando': return '#2196F3';
    case 'concluido': return '#4CAF50';
    case 'cancelado': return '#F44336';
    default: return '#666';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'pendente': return 'Pendente';
    case 'processando': return 'Processando';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    case 'Todos': return 'Todos';
    default: return status;
  }
};
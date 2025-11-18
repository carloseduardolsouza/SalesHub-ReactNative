export const getFieldValue = (cliente, fieldKey) => {
  switch (fieldKey) {
    case 'cidade':
      return cliente.endereco?.cidade || '-';
    case 'estado':
      return cliente.endereco?.estado || '-';
    case 'dataNascimento':
      return cliente.dataNascimento instanceof Date 
        ? cliente.dataNascimento.toLocaleDateString('pt-BR')
        : '-';
    case 'enderecoCompleto':
      return getEnderecoCompleto(cliente);
    default:
      return cliente[fieldKey] || '-';
  }
};

export const getEnderecoCompleto = (cliente) => {
  const end = cliente.endereco;
  if (!end || !end.logradouro) return '-';
  
  const partes = [
    end.logradouro,
    end.numero,
    end.bairro,
    end.cidade,
    end.estado
  ].filter(Boolean);
  
  return partes.join(', ');
};
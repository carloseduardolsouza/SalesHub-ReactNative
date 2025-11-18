export const formatCNPJ = (cnpj) => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length <= 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
};

export const formatCEP = (cep) => {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length <= 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
};

export const formatTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let formatted = cleaned;
  if (cleaned.length > 2 && cleaned.length <= 7) {
    formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}`;
  } else if (cleaned.length > 7 && cleaned.length <= 11) {
    formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  } else if (cleaned.length > 11) {
    formatted = cleaned.substring(0, 11);
    formatted = `(${formatted.substring(0, 2)}) ${formatted.substring(2, 7)}-${formatted.substring(7, 11)}`;
  }
  return formatted;
};
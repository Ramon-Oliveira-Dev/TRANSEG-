/**
 * Utilitários para formatação e validação de telefones brasileiros com DDD
 * Padrão: (DD) 9XXXX-XXXX (celular 11 dígitos) ou (DD) XXXX-XXXX (fixo 10 dígitos)
 */

export const formatPhoneBR = (value: string): string => {
  if (!value) return '';
  // Remove tudo que não for dígito numérico e limita a 11 dígitos (2 DDD + 9 número)
  const digits = value.replace(/\D/g, '').slice(0, 11);
  
  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // Fixo (10 dígitos): (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Celular (11 dígitos): (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const isValidPhoneBR = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

export const getCleanDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

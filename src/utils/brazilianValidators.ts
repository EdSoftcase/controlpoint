/**
 * Algoritmos oficiais de validação e formatação de documentos brasileiros
 * em conformidade com as regras da Receita Federal do Brasil e MTP.
 */

export function cleanDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Validação estrita do CNPJ com cálculo dos dois dígitos verificadores (módulo 11)
 */
export function validateCNPJ(cnpjInput: string): { isValid: boolean; error?: string } {
  const digits = cleanDigits(cnpjInput);

  if (!digits) {
    return { isValid: false, error: 'CNPJ é obrigatório.' };
  }

  if (digits.length !== 14) {
    return { isValid: false, error: 'CNPJ deve conter exatamente 14 dígitos numéricos.' };
  }

  // Elimina CNPJs conhecidos inválidos com dígitos todos iguais (11.111.111/1111-11, etc.)
  if (/^(\d)\1+$/.test(digits)) {
    return { isValid: false, error: 'CNPJ inválido: sequência de números idênticos rejeitada.' };
  }

  // Validação do 1º Dígito Verificador
  let length = digits.length - 2;
  let numbers = digits.substring(0, length);
  const verifyingDigits = digits.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(verifyingDigits.charAt(0), 10)) {
    return { isValid: false, error: 'CNPJ inválido: primeiro dígito verificador incorreto.' };
  }

  // Validação do 2º Dígito Verificador
  length = length + 1;
  numbers = digits.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(verifyingDigits.charAt(1), 10)) {
    return { isValid: false, error: 'CNPJ inválido: segundo dígito verificador incorreto.' };
  }

  return { isValid: true };
}

export function formatCNPJ(value: string): string {
  const digits = cleanDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Validação estrita do CPF (módulo 11)
 */
export function validateCPF(cpfInput: string): { isValid: boolean; error?: string } {
  const digits = cleanDigits(cpfInput);

  if (!digits) {
    return { isValid: false, error: 'CPF é obrigatório.' };
  }

  if (digits.length !== 11) {
    return { isValid: false, error: 'CPF deve conter exatamente 11 dígitos numéricos.' };
  }

  if (/^(\d)\1+$/.test(digits)) {
    return { isValid: false, error: 'CPF inválido: sequência com números repetidos.' };
  }

  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(digits.substring(i - 1, i), 10) * (11 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(9, 10), 10)) {
    return { isValid: false, error: 'CPF inválido: 1º dígito verificador incorreto.' };
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(digits.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits.substring(10, 11), 10)) {
    return { isValid: false, error: 'CPF inválido: 2º dígito verificador incorreto.' };
  }

  return { isValid: true };
}

export function formatCPF(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatCEP(value: string): string {
  const digits = cleanDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function formatPhone(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

/**
 * Validação de e-mail RFC 5322
 */
export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test((email || '').trim());
}

/**
 * Validação de PIS/NIS/PASEP (11 dígitos)
 */
export function validatePIS(pisInput: string): boolean {
  const digits = cleanDigits(pisInput);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * weights[i];
  }
  const rest = sum % 11;
  const dv = rest < 2 ? 0 : 11 - rest;
  return dv === parseInt(digits[10], 10);
}

/**
 * Valida se o PIN/Token de contingência ainda é elegível para uso.
 * Regra Portaria 671 / Regra de Negócio: O PIN/Token é válido EXCLUSIVAMENTE no 1º dia de trabalho (recém-contratado).
 * A partir do 2º dia, ele expira automaticamente e a marcação exige Leitura Facial.
 */
export function checkPinUsageEligibility(
  colab?: { dataAdmissao?: string; created_at?: string },
  registrosPontoColab?: { dataHora?: string }[]
): { isEligible: boolean; reason?: string } {
  const todayYMD = new Date().toISOString().slice(0, 10);

  // 1. Se o colaborador possui registros de ponto de dias anteriores ao dia de hoje
  if (registrosPontoColab && registrosPontoColab.length > 0) {
    const datasPontoAnteriores = registrosPontoColab
      .map(r => (r.dataHora ? r.dataHora.slice(0, 10) : ''))
      .filter(d => d && d < todayYMD);

    if (datasPontoAnteriores.length > 0) {
      return {
        isEligible: false,
        reason: 'O PIN/Token temporário expira após o 1º dia de uso. Como você já possui pontos registrados em dias anteriores, a marcação exige Leitura Facial.'
      };
    }
  }

  // 2. Se a data de admissão for anterior a hoje
  if (colab && colab.dataAdmissao && colab.dataAdmissao < todayYMD) {
    const dataAdmissaoDate = new Date(colab.dataAdmissao + 'T00:00:00');
    const hojeDate = new Date(todayYMD + 'T00:00:00');
    const diffDays = Math.floor((hojeDate.getTime() - dataAdmissaoDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      return {
        isEligible: false,
        reason: `O PIN/Token era válido exclusivamente no 1º dia de uso (${colab.dataAdmissao}). O prazo de contingência expirou. A Leitura Facial é obrigatória.`
      };
    }
  }

  return { isEligible: true };
}

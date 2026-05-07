export const formatCurrencyInput = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits === '') return '';
  const num = parseInt(digits, 10);
  const formatted = (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return formatted;
};

export const parseCurrencyInput = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
};

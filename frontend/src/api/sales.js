import api from './api';

export const getSales = async () => {
  try {
    const response = await api.get('/sales');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSale = async (saleId, saleData) => {
  try {
    const response = await api.put(`/sales/${saleId}`, saleData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCustomerDebts = async () => {
  try {
    const response = await api.get('/sales/debts');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadCustomerDebtReport = async (customerEmail) => {
  try {
    const response = await api.get(`/sales/debts/${customerEmail}/report`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `debt_report_${customerEmail.replace('@', '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    throw error;
  }
};

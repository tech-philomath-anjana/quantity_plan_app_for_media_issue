// /app/services/apiService.js
import { API_BASE } from '../config';

export const fetchMediaProducts = async (authFetch) => {
  try {
    const response = await authFetch(`${API_BASE}/fetch-master-data`, {
      method: 'POST',
      body: JSON.stringify({
        "masters": ["MediaProduct"]
      }),
    });

    const data = await response.json();
    
    if (data.success && data.data.MediaProduct) {
      // Convert to format your component expects
      return data.data.MediaProduct.map(item => ({
        code: item.product_code,
        desc: item.product_desc
      }));
    } else {
      throw new Error('Failed to fetch media products');
    }
  } catch (error) {
    console.error('Error fetching media products:', error);
    return [];
  }
};
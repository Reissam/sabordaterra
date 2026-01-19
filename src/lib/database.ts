import { supabase } from '../lib/supabase';

// Funções para gerenciar configurações
export const getSetting = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      console.error('Error getting setting:', error);
      return null;
    }
    
    return data?.value || null;
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
};

export const setSetting = async (key: string, value: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value });
    
    if (error) {
      console.error('Error setting setting:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error setting setting:', error);
    return false;
  }
};

// Funções para gerenciar clientes
export const getCustomers = async () => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting customers:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting customers:', error);
    return [];
  }
};

export const saveCustomer = async (customer: Omit<any, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving customer:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error saving customer:', error);
    return null;
  }
};

export const updateCustomer = async (id: string, updates: Partial<any>) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating customer:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating customer:', error);
    return null;
  }
};

// Funções para gerenciar produtos
export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error getting products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const updateProduct = async (id: string, updates: Partial<any>) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
};

// Funções para gerenciar pedidos
export const saveOrder = async (order: Omit<any, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving order:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error saving order:', error);
    return null;
  }
};

export const getOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting orders:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
};

export const updateOrderStatus = async (id: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating order status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
};

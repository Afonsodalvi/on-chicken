import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Interface para Development Course Subscription
export interface DevelopmentCourseSubscription {
  id?: string;
  email: string;
  subscribed_at?: string;
  is_active?: boolean;
  created_at?: string;
}

// Interface para RWAnimals Collection
export interface RWAnimalsCollection {
  id?: string;
  collection_name: string;
  description: string;
  images_link: string;
  region: string;
  farm_type: string;
  total_nfts: number;
  owner_email: string;
  owner_name?: string;
  farm_name?: string;
  status?: string;
  created_at?: string;
}

// Função para inscrever no curso de desenvolvimento
export const subscribeToDevelopmentCourse = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('development_course_subscriptions')
      .insert([
        {
          email: email,
          is_active: true
        }
      ])
      .select();

    if (error) {
      console.error('Error subscribing to development course:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully subscribed to development course:', data);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Erro inesperado ao se inscrever no curso' };
  }
};

// Função para submeter coleção de RWAnimals
export const submitRWAnimalsCollection = async (collection: Omit<RWAnimalsCollection, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const { data, error } = await supabase
      .from('rwanimals_collections')
      .insert([
        {
          collection_name: collection.collection_name,
          description: collection.description,
          images_link: collection.images_link,
          region: collection.region,
          farm_type: collection.farm_type,
          total_nfts: collection.total_nfts,
          owner_email: collection.owner_email,
          owner_name: collection.owner_name,
          farm_name: collection.farm_name,
          status: 'pending'
        }
      ])
      .select();

    if (error) {
      console.error('Error submitting RWAnimals collection:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully submitted RWAnimals collection:', data);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Erro inesperado ao submeter a coleção' };
  }
};

// Função para buscar coleções de RWAnimals por email
export const getRWAnimalsCollectionsByEmail = async (email: string): Promise<{ success: boolean; data?: RWAnimalsCollection[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('rwanimals_collections')
      .select('*')
      .eq('owner_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching RWAnimals collections:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Erro inesperado ao buscar coleções' };
  }
};

// Função para buscar todas as coleções (admin)
export const getAllRWAnimalsCollections = async (): Promise<{ success: boolean; data?: RWAnimalsCollection[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('rwanimals_collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all RWAnimals collections:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Erro inesperado ao buscar todas as coleções' };
  }
};

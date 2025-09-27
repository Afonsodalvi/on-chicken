import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwtqiiktatowmolwglfl.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('❌ VITE_SUPABASE_ANON_KEY não configurada! Configure no arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para a whitelist
export interface WhitelistEntry {
  id?: number
  wallet_address: string
  user_name?: string
  email?: string
  twitter_post_url?: string
  instagram_post_url?: string
  linkedin_post_url?: string
  other_social_url?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at?: string
  updated_at?: string
  approved_by?: string
  notes?: string
}

export interface WhitelistStats {
  total_requests: number
  approved_count: number
  pending_count: number
  rejected_count: number
  requests_today: number
}

// Funções para gerenciar a whitelist
export const whitelistService = {
  // Adicionar endereço à whitelist
  async addToWhitelist(data: Omit<WhitelistEntry, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Verificar se a chave API está configurada
      if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
        throw new Error('Chave API do Supabase não configurada. Verifique o arquivo .env')
      }

      const { data: result, error } = await supabase
        .from('wallet_whitelist')
        .insert([data])
        .select()
        .single()

      if (error) {
        console.error('Erro do Supabase:', error)
        throw error
      }

      return { success: true, data: result }
    } catch (error: any) {
      console.error('Erro ao adicionar à whitelist:', error)
      return { 
        success: false, 
        error: error.message || 'Erro desconhecido ao conectar com o banco de dados'
      }
    }
  },

  // Verificar se endereço está na whitelist
  async checkWhitelistStatus(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from('wallet_whitelist')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return { success: true, data: data || null }
    } catch (error) {
      console.error('Erro ao verificar whitelist:', error)
      return { success: false, error: error.message }
    }
  },

  // Listar todas as entradas da whitelist (admin)
  async getAllWhitelistEntries() {
    try {
      const { data, error } = await supabase
        .from('wallet_whitelist')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao buscar whitelist:', error)
      return { success: false, error: error.message }
    }
  },

  // Atualizar status de uma entrada
  async updateWhitelistStatus(id: number, status: 'pending' | 'approved' | 'rejected', approvedBy?: string, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('wallet_whitelist')
        .update({ 
          status, 
          approved_by: approvedBy,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      return { success: false, error: error.message }
    }
  },

  // Obter estatísticas da whitelist
  async getWhitelistStats() {
    try {
      const { data, error } = await supabase
        .from('whitelist_stats')
        .select('*')
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return { success: false, error: error.message }
    }
  },

  // Remover entrada da whitelist
  async removeFromWhitelist(id: number) {
    try {
      const { error } = await supabase
        .from('wallet_whitelist')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao remover da whitelist:', error)
      return { success: false, error: error.message }
    }
  }
}

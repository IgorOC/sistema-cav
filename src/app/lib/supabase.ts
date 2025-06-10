import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para TypeScript
export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento?: string;
  habilitacao?: string;
  foto_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  cor: string;
  ano?: number;
  foto_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistroAcesso {
  id: string;
  usuario_id?: string;
  veiculo_id?: string;
  placa: string;
  tipo_movimento: "entrada" | "saida";
  data_hora: string;
  observacoes?: string;
  foto_url?: string;
  created_at: string;
  // Dados relacionados
  usuarios?: Usuario;
  veiculos?: Veiculo;
}

export interface UsuarioVeiculo {
  id: string;
  usuario_id: string;
  veiculo_id: string;
  created_at: string;
  usuarios?: {
    id: string;
    nome: string;
    cpf: string;
  } | null;
  veiculos?: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
  } | null;
}

// Interface para os dados brutos do Supabase
export interface UsuarioVeiculoRaw {
  id: string;
  usuario_id: string;
  veiculo_id: string;
  created_at: string;
  usuarios: {
    id: string;
    nome: string;
    cpf: string;
  }[];
  veiculos: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
  }[];
}

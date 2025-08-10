import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'landowner' | 'public';
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'landowner' | 'public';
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'landowner' | 'public';
          phone?: string | null;
          created_at?: string;
        };
      };
      land_records: {
        Row: {
          id: string;
          title: string;
          location: string;
          coordinates: string | null;
          size: number;
          size_unit: string;
          ownership_status: 'verified' | 'pending' | 'disputed';
          zoning: string;
          price: number | null;
          description: string | null;
          owner_id: string | null;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          location: string;
          coordinates?: string | null;
          size: number;
          size_unit?: string;
          ownership_status?: 'verified' | 'pending' | 'disputed';
          zoning: string;
          price?: number | null;
          description?: string | null;
          owner_id?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          location?: string;
          coordinates?: string | null;
          size?: number;
          size_unit?: string;
          ownership_status?: 'verified' | 'pending' | 'disputed';
          zoning?: string;
          price?: number | null;
          description?: string | null;
          owner_id?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ownership_documents: {
        Row: {
          id: string;
          land_record_id: string;
          document_type: 'deed' | 'survey' | 'certificate' | 'other';
          document_url: string;
          status: 'pending' | 'approved' | 'rejected';
          submitted_by: string;
          reviewed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          land_record_id: string;
          document_type: 'deed' | 'survey' | 'certificate' | 'other';
          document_url: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by: string;
          reviewed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          land_record_id?: string;
          document_type?: 'deed' | 'survey' | 'certificate' | 'other';
          document_url?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          reviewed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          land_record_id: string;
          from_owner: string;
          to_owner: string;
          transaction_type: 'sale' | 'transfer' | 'inheritance';
          amount: number | null;
          status: 'pending' | 'approved' | 'completed' | 'cancelled';
          approved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          land_record_id: string;
          from_owner: string;
          to_owner: string;
          transaction_type: 'sale' | 'transfer' | 'inheritance';
          amount?: number | null;
          status?: 'pending' | 'approved' | 'completed' | 'cancelled';
          approved_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          land_record_id?: string;
          from_owner?: string;
          to_owner?: string;
          transaction_type?: 'sale' | 'transfer' | 'inheritance';
          amount?: number | null;
          status?: 'pending' | 'approved' | 'completed' | 'cancelled';
          approved_by?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'warning' | 'success' | 'error';
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: 'info' | 'warning' | 'success' | 'error';
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'info' | 'warning' | 'success' | 'error';
          read?: boolean;
          created_at?: string;
        };
      };
      zoning_laws: {
        Row: {
          id: string;
          zone_type: string;
          description: string;
          regulations: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          zone_type: string;
          description: string;
          regulations: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          zone_type?: string;
          description?: string;
          regulations?: string;
          created_at?: string;
        };
      };
    };
  };
};
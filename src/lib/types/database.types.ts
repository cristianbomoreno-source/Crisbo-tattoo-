export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artist_permissions: {
        Row: {
          artist_id: string
          can_block_schedule: boolean
          can_cancel_sessions: boolean
          can_create_appointments: boolean
          can_create_clients: boolean
          can_create_inventory_categories: boolean
          can_create_projects: boolean
          can_delete_projects: boolean
          can_discount_materials: boolean
          can_edit_clients: boolean
          can_edit_duration: boolean
          can_edit_inventory: boolean
          can_edit_projects: boolean
          can_modify_prices: boolean
          can_move_appointments: boolean
          can_respond_quotes: boolean
          can_use_inventory: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          can_block_schedule?: boolean
          can_cancel_sessions?: boolean
          can_create_appointments?: boolean
          can_create_clients?: boolean
          can_create_inventory_categories?: boolean
          can_create_projects?: boolean
          can_delete_projects?: boolean
          can_discount_materials?: boolean
          can_edit_clients?: boolean
          can_edit_duration?: boolean
          can_edit_inventory?: boolean
          can_edit_projects?: boolean
          can_modify_prices?: boolean
          can_move_appointments?: boolean
          can_respond_quotes?: boolean
          can_use_inventory?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          can_block_schedule?: boolean
          can_cancel_sessions?: boolean
          can_create_appointments?: boolean
          can_create_clients?: boolean
          can_create_inventory_categories?: boolean
          can_create_projects?: boolean
          can_delete_projects?: boolean
          can_discount_materials?: boolean
          can_edit_clients?: boolean
          can_edit_duration?: boolean
          can_edit_inventory?: boolean
          can_edit_projects?: boolean
          can_modify_prices?: boolean
          can_move_appointments?: boolean
          can_respond_quotes?: boolean
          can_use_inventory?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_permissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          created_at: string
          experience_range: string | null
          full_time: boolean | null
          id: string
          name: string
          own_studio: boolean | null
          role: string | null
          specialty: string | null
          status: string
          studio_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_range?: string | null
          full_time?: boolean | null
          id?: string
          name: string
          own_studio?: boolean | null
          role?: string | null
          specialty?: string | null
          status?: string
          studio_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_range?: string | null
          full_time?: boolean | null
          id?: string
          name?: string
          own_studio?: boolean | null
          role?: string | null
          specialty?: string | null
          status?: string
          studio_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_days: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          studio_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          studio_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_days_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          artist_id: string | null
          birthdate: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          external_reservation_id: string | null
          first_session_date: string | null
          id: string
          instagram: string | null
          last_session_date: string | null
          name: string
          notes: string | null
          phone: string | null
          preferred_services: string[] | null
          source: string | null
          studio_id: string | null
          total_sessions: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          artist_id?: string | null
          birthdate?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          external_reservation_id?: string | null
          first_session_date?: string | null
          id?: string
          instagram?: string | null
          last_session_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_services?: string[] | null
          source?: string | null
          studio_id?: string | null
          total_sessions?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          artist_id?: string | null
          birthdate?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          external_reservation_id?: string | null
          first_session_date?: string | null
          id?: string
          instagram?: string | null
          last_session_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_services?: string[] | null
          source?: string | null
          studio_id?: string | null
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_links: {
        Row: {
          client_id: string | null
          consent_id: string | null
          created_at: string
          expires_at: string | null
          form_data: Json | null
          has_medical_alert: boolean
          id: string
          project_id: string | null
          signature_data: string | null
          signed_at: string | null
          signer_ip: string | null
          signer_user_agent: string | null
          status: string
          studio_id: string | null
          template_id: string | null
          token: string
        }
        Insert: {
          client_id?: string | null
          consent_id?: string | null
          created_at?: string
          expires_at?: string | null
          form_data?: Json | null
          has_medical_alert?: boolean
          id?: string
          project_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          signer_user_agent?: string | null
          status?: string
          studio_id?: string | null
          template_id?: string | null
          token: string
        }
        Update: {
          client_id?: string | null
          consent_id?: string | null
          created_at?: string
          expires_at?: string | null
          form_data?: Json | null
          has_medical_alert?: boolean
          id?: string
          project_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          signer_user_agent?: string | null
          status?: string
          studio_id?: string | null
          template_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_links_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_links_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_links_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "consent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_templates_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          pdf_url: string | null
          project_id: string | null
          signature_data: string | null
          signed_at: string | null
          studio_id: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          project_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          studio_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          project_id?: string | null
          signature_data?: string | null
          signed_at?: string | null
          studio_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "consent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_feedback: {
        Row: {
          artist_id: string | null
          comment: string | null
          created_at: string
          feature_key: string
          id: string
          rating: number
          studio_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_id?: string | null
          comment?: string | null
          created_at?: string
          feature_key: string
          id?: string
          rating: number
          studio_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_id?: string | null
          comment?: string | null
          created_at?: string
          feature_key?: string
          id?: string
          rating?: number
          studio_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_feedback_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_feedback_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          artist_id: string | null
          caption: string | null
          created_at: string
          id: string
          project_id: string | null
          sort_order: number
          storage_path: string
          studio_id: string | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          artist_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          sort_order?: number
          storage_path: string
          studio_id?: string | null
          type?: string
          updated_at?: string
          url: string
        }
        Update: {
          artist_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          sort_order?: number
          storage_path?: string
          studio_id?: string | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          studio_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          studio_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          default_qty_per_session: number
          id: string
          min_stock: number | null
          name: string
          notes: string | null
          quantity: number
          studio_id: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_qty_per_session?: number
          id?: string
          min_stock?: number | null
          name: string
          notes?: string | null
          quantity?: number
          studio_id?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_qty_per_session?: number
          id?: string
          min_stock?: number | null
          name?: string
          notes?: string | null
          quantity?: number
          studio_id?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          artist_id: string | null
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          studio_id: string | null
          title: string
        }
        Insert: {
          artist_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          studio_id?: string | null
          title: string
        }
        Update: {
          artist_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          studio_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string
          payment_method: string | null
          project_id: string | null
          session_id: string | null
          studio_id: string | null
          type: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          project_id?: string | null
          session_id?: string | null
          studio_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          project_id?: string | null
          session_id?: string | null
          studio_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          artist_id: string
          client_id: string | null
          created_at: string
          deposit: number | null
          deposit_percentage: number | null
          id: string
          manual_progress: number | null
          name: string
          notes: string | null
          quote_id: string | null
          session_count: number | null
          status: string
          studio_id: string | null
          total_value: number | null
          updated_at: string
          worked_minutes: number
        }
        Insert: {
          artist_id: string
          client_id?: string | null
          created_at?: string
          deposit?: number | null
          deposit_percentage?: number | null
          id?: string
          manual_progress?: number | null
          name: string
          notes?: string | null
          quote_id?: string | null
          session_count?: number | null
          status?: string
          studio_id?: string | null
          total_value?: number | null
          updated_at?: string
          worked_minutes?: number
        }
        Update: {
          artist_id?: string
          client_id?: string | null
          created_at?: string
          deposit?: number | null
          deposit_percentage?: number | null
          id?: string
          manual_progress?: number | null
          name?: string
          notes?: string | null
          quote_id?: string | null
          session_count?: number | null
          status?: string
          studio_id?: string | null
          total_value?: number | null
          updated_at?: string
          worked_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_links: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          quote_id: string
          studio_id: string
          token: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at: string
          id?: string
          quote_id: string
          studio_id: string
          token: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          quote_id?: string
          studio_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_links_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_links_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          artist_id: string | null
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          studio_id: string
        }
        Insert: {
          artist_id?: string | null
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          studio_id: string
        }
        Update: {
          artist_id?: string | null
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          age: number | null
          artist_id: string | null
          availability: string | null
          avg_session_duration: string | null
          body_zone: string | null
          client_id: string | null
          color: string | null
          created_at: string
          deposit_percentage: number | null
          description: string | null
          extra_photo_paths: string[] | null
          gender: string | null
          id: string
          is_courtesy: boolean | null
          notes: string | null
          price: number | null
          reference_photo_path: string | null
          service: string | null
          session_count: number | null
          size: string | null
          skin_tone: string | null
          source: string | null
          status: string | null
          studio_id: string | null
          style: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          artist_id?: string | null
          availability?: string | null
          avg_session_duration?: string | null
          body_zone?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          deposit_percentage?: number | null
          description?: string | null
          extra_photo_paths?: string[] | null
          gender?: string | null
          id?: string
          is_courtesy?: boolean | null
          notes?: string | null
          price?: number | null
          reference_photo_path?: string | null
          service?: string | null
          session_count?: number | null
          size?: string | null
          skin_tone?: string | null
          source?: string | null
          status?: string | null
          studio_id?: string | null
          style?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          artist_id?: string | null
          availability?: string | null
          avg_session_duration?: string | null
          body_zone?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          deposit_percentage?: number | null
          description?: string | null
          extra_photo_paths?: string[] | null
          gender?: string | null
          id?: string
          is_courtesy?: boolean | null
          notes?: string | null
          price?: number | null
          reference_photo_path?: string | null
          service?: string | null
          session_count?: number | null
          size?: string | null
          skin_tone?: string | null
          source?: string | null
          status?: string | null
          studio_id?: string | null
          style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      session_materials: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string
          quantity: number
          session_id: string
          studio_id: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id: string
          quantity: number
          session_id: string
          studio_id: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string
          quantity?: number
          session_id?: string
          studio_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_materials_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_materials_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          artist_id: string | null
          client_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          project_id: string | null
          reminder_sent_at: string | null
          scheduled_at: string
          status: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          artist_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          artist_id?: string | null
          client_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_invitations: {
        Row: {
          created_at: string
          id: string
          invited_by_artist_id: string | null
          invited_email: string
          invited_user_id: string | null
          responded_at: string | null
          status: string
          studio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by_artist_id?: string | null
          invited_email: string
          invited_user_id?: string | null
          responded_at?: string | null
          status?: string
          studio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by_artist_id?: string | null
          invited_email?: string
          invited_user_id?: string | null
          responded_at?: string | null
          status?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_invitations_invited_by_artist_id_fkey"
            columns: ["invited_by_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_invitations_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_join_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          resolved_at: string | null
          specialty: string | null
          status: string
          studio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          resolved_at?: string | null
          specialty?: string | null
          status?: string
          studio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          resolved_at?: string | null
          specialty?: string | null
          status?: string
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_join_requests_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_links: {
        Row: {
          created_at: string
          enabled: boolean
          icon: string
          id: string
          label: string
          sort_order: number
          studio_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          icon?: string
          id?: string
          label: string
          sort_order?: number
          studio_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          icon?: string
          id?: string
          label?: string
          sort_order?: number
          studio_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_links_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          accepts_residents: boolean
          account_kind: string
          address: string | null
          artist_count: string | null
          bot_ask_availability: boolean
          bot_contact_template: string
          cabins: number | null
          cancellation_policy: string | null
          city: string | null
          close_time: string | null
          contact_client_template: string
          cover_photo_path: string | null
          cover_photo_url: string | null
          created_at: string
          deposit_mode: string | null
          deposit_value: number | null
          description: string | null
          facebook: string | null
          id: string
          instagram: string | null
          join_code: string
          logo_path: string | null
          logo_url: string | null
          maps_url: string | null
          max_artists: number
          monthly_goal_approved_projects: number | null
          monthly_goal_quoted_value: number | null
          monthly_goal_scheduled_sessions: number | null
          name: string
          onboarding_steps_done: string[] | null
          open_days: string[] | null
          open_time: string | null
          payment_methods: string[] | null
          payment_policy: string | null
          price_presets: Json
          quote_confirm_template: string
          quote_letter_message: string | null
          quote_message_template: string | null
          quote_price_negotiable: boolean
          quote_template_color: string | null
          reminder_balance_template: string
          reminder_session_template: string
          slot_interval_minutes: number
          slug: string
          stations: number | null
          studio_rules: string[] | null
          studio_type: string | null
          styles: string[] | null
          tiktok: string | null
          updated_at: string
          website: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          accepts_residents?: boolean
          account_kind?: string
          address?: string | null
          artist_count?: string | null
          bot_ask_availability?: boolean
          bot_contact_template?: string
          cabins?: number | null
          cancellation_policy?: string | null
          city?: string | null
          close_time?: string | null
          contact_client_template?: string
          cover_photo_path?: string | null
          cover_photo_url?: string | null
          created_at?: string
          deposit_mode?: string | null
          deposit_value?: number | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          join_code?: string
          logo_path?: string | null
          logo_url?: string | null
          maps_url?: string | null
          max_artists?: number
          monthly_goal_approved_projects?: number | null
          monthly_goal_quoted_value?: number | null
          monthly_goal_scheduled_sessions?: number | null
          name: string
          onboarding_steps_done?: string[] | null
          open_days?: string[] | null
          open_time?: string | null
          payment_methods?: string[] | null
          payment_policy?: string | null
          price_presets?: Json
          quote_confirm_template?: string
          quote_letter_message?: string | null
          quote_message_template?: string | null
          quote_price_negotiable?: boolean
          quote_template_color?: string | null
          reminder_balance_template?: string
          reminder_session_template?: string
          slot_interval_minutes?: number
          slug: string
          stations?: number | null
          studio_rules?: string[] | null
          studio_type?: string | null
          styles?: string[] | null
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          accepts_residents?: boolean
          account_kind?: string
          address?: string | null
          artist_count?: string | null
          bot_ask_availability?: boolean
          bot_contact_template?: string
          cabins?: number | null
          cancellation_policy?: string | null
          city?: string | null
          close_time?: string | null
          contact_client_template?: string
          cover_photo_path?: string | null
          cover_photo_url?: string | null
          created_at?: string
          deposit_mode?: string | null
          deposit_value?: number | null
          description?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          join_code?: string
          logo_path?: string | null
          logo_url?: string | null
          maps_url?: string | null
          max_artists?: number
          monthly_goal_approved_projects?: number | null
          monthly_goal_quoted_value?: number | null
          monthly_goal_scheduled_sessions?: number | null
          name?: string
          onboarding_steps_done?: string[] | null
          open_days?: string[] | null
          open_time?: string | null
          payment_methods?: string[] | null
          payment_policy?: string | null
          price_presets?: Json
          quote_confirm_template?: string
          quote_letter_message?: string | null
          quote_message_template?: string | null
          quote_price_negotiable?: boolean
          quote_template_color?: string | null
          reminder_balance_template?: string
          reminder_session_template?: string
          slot_interval_minutes?: number
          slug?: string
          stations?: number | null
          studio_rules?: string[] | null
          studio_type?: string | null
          styles?: string[] | null
          tiktok?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      tour_progress: {
        Row: {
          artist_id: string
          created_at: string
          current_step: number
          id: string
          status: string
          tour_key: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          current_step?: number
          id?: string
          status?: string
          tour_key: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          current_step?: number
          id?: string
          status?: string
          tour_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_progress_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_account: {
        Row: {
          artist_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_account_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      work_shifts: {
        Row: {
          artist_id: string
          created_at: string
          ended_at: string | null
          id: string
          session_id: string | null
          started_at: string
          studio_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          session_id?: string | null
          started_at?: string
          studio_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          session_id?: string | null
          started_at?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_shifts_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_artist_id: { Args: never; Returns: string }
      current_studio_id: { Args: never; Returns: string }
      is_studio_owner: { Args: never; Returns: boolean }
      list_my_accounts: {
        Args: never
        Returns: {
          account_kind: string
          artist_id: string
          is_active: boolean
          role: string
          studio_id: string
          studio_name: string
        }[]
      }
      set_active_account: { Args: { p_artist_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

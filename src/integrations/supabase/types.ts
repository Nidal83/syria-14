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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          governorate_id: string
          id: string
          key: string
          name_ar: string
          name_en: string
        }
        Insert: {
          governorate_id: string
          id?: string
          key: string
          name_ar: string
          name_en: string
        }
        Update: {
          governorate_id?: string
          id?: string
          key?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_governorate_id_fkey"
            columns: ["governorate_id"]
            isOneToOne: false
            referencedRelation: "governorates"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_offices: {
        Row: {
          id: string
          user_id: string
          office_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          office_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          office_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_offices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_offices_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      governorates: {
        Row: {
          id: string
          key: string
          name_ar: string
          name_en: string
        }
        Insert: {
          id?: string
          key: string
          name_ar: string
          name_en: string
        }
        Update: {
          id?: string
          key?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          id: string
          message: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      office_applications: {
        Row: {
          city: string
          created_at: string
          description: string
          document_url: string | null
          id: string
          id_document_url: string | null
          logo_url: string | null
          office_name: string
          office_slug: string | null
          phone: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string
          created_at?: string
          description?: string
          document_url?: string | null
          id?: string
          id_document_url?: string | null
          logo_url?: string | null
          office_name: string
          office_slug?: string | null
          phone: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string
          document_url?: string | null
          id?: string
          id_document_url?: string | null
          logo_url?: string | null
          office_name?: string
          office_slug?: string | null
          phone?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_applications_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_members: {
        Row: {
          created_at: string
          id: string
          name: string
          office_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          office_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          office_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_members_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address: string
          area_id: string | null
          created_at: string
          description: string
          email: string
          governorate_id: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          office_name: string
          owner_id: string
          owner_name: string
          phone: string
          slug: string | null
          status: Database["public"]["Enums"]["office_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string
          area_id?: string | null
          created_at?: string
          description?: string
          email: string
          governorate_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          office_name: string
          owner_id: string
          owner_name: string
          phone: string
          slug?: string | null
          status?: Database["public"]["Enums"]["office_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          area_id?: string | null
          created_at?: string
          description?: string
          email?: string
          governorate_id?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          office_name?: string
          owner_id?: string
          owner_name?: string
          phone?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["office_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_governorate_id_fkey"
            columns: ["governorate_id"]
            isOneToOne: false
            referencedRelation: "governorates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id: string
          name?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: Json
          area_id: string | null
          area_size: number
          bathrooms: number
          building_age: number
          category: string
          contact_phone: string
          created_at: string
          currency: string
          description: string
          direction: string
          district: string | null
          featured_image: string | null
          features: string[]
          floor: number
          furnished: boolean
          governorate_id: string | null
          id: string
          kitchens: number
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          living_rooms: number
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          office_id: string
          ownership_type: string
          payment_method: string
          price: number
          property_type: string
          rejection_reason: string | null
          rooms: number
          slug: string | null
          status: string
          title: string
          total_floors: number
          updated_at: string
          video_url: string
          view: string
          whatsapp: string
        }
        Insert: {
          address?: string
          amenities?: Json
          area_id?: string | null
          area_size?: number
          bathrooms?: number
          building_age?: number
          category?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          description?: string
          direction?: string
          district?: string | null
          featured_image?: string | null
          features?: string[]
          floor?: number
          furnished?: boolean
          governorate_id?: string | null
          id?: string
          kitchens?: number
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          living_rooms?: number
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          office_id: string
          ownership_type?: string
          payment_method?: string
          price?: number
          property_type?: string
          rejection_reason?: string | null
          rooms?: number
          slug?: string | null
          status?: string
          title: string
          total_floors?: number
          updated_at?: string
          video_url?: string
          view?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          amenities?: Json
          area_id?: string | null
          area_size?: number
          bathrooms?: number
          building_age?: number
          category?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          description?: string
          direction?: string
          district?: string | null
          featured_image?: string | null
          features?: string[]
          floor?: number
          furnished?: boolean
          governorate_id?: string | null
          id?: string
          kitchens?: number
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          living_rooms?: number
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          office_id?: string
          ownership_type?: string
          payment_method?: string
          price?: number
          property_type?: string
          rejection_reason?: string | null
          rooms?: number
          slug?: string | null
          status?: string
          title?: string
          total_floors?: number
          updated_at?: string
          video_url?: string
          view?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_governorate_id_fkey"
            columns: ["governorate_id"]
            isOneToOne: false
            referencedRelation: "governorates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          id: string
          image_url: string
          is_cover: boolean
          property_id: string
        }
        Insert: {
          id?: string
          image_url: string
          is_cover?: boolean
          property_id: string
        }
        Update: {
          id?: string
          image_url?: string
          is_cover?: boolean
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      listing_type: "rent" | "sale"
      office_status: "pending" | "approved" | "rejected"
      user_role: "user" | "pending_office" | "office" | "admin"
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
    Enums: {
      listing_type: ["rent", "sale"],
      office_status: ["pending", "approved", "rejected"],
      user_role: ["user", "pending_office", "office", "admin"],
    },
  },
} as const

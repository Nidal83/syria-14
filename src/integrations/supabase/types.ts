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
          area_id: string | null
          created_at: string
          email: string
          governorate_id: string | null
          id: string
          office_name: string
          office_slug: string | null
          owner_id: string
          owner_name: string
          phone: string
          status: Database["public"]["Enums"]["office_status"]
          verification_document_url: string | null
          id_document_url: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          email: string
          governorate_id?: string | null
          id?: string
          office_name: string
          office_slug?: string | null
          owner_id: string
          owner_name: string
          phone: string
          status?: Database["public"]["Enums"]["office_status"]
          verification_document_url?: string | null
          id_document_url?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string
          email?: string
          governorate_id?: string | null
          id?: string
          office_name?: string
          office_slug?: string | null
          owner_id?: string
          owner_name?: string
          phone?: string
          status?: Database["public"]["Enums"]["office_status"]
          verification_document_url?: string | null
          id_document_url?: string | null
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
          created_at: string
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          name?: string
          phone?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          area_id: string | null
          area_size: number
          bathrooms: number
          building_age: number
          contact_phone: string
          created_at: string
          description: string
          direction: string
          features: string[]
          floor: number
          furnished: boolean
          governorate_id: string | null
          id: string
          kitchens: number
          listing_type: Database["public"]["Enums"]["listing_type"]
          living_rooms: number
          office_id: string
          ownership_type: string
          payment_method: string
          price: number
          property_type: string
          rooms: number
          status: string
          title: string
          total_floors: number
          video_url: string
          view: string
          whatsapp: string
        }
        Insert: {
          address?: string
          area_id?: string | null
          area_size?: number
          bathrooms?: number
          building_age?: number
          contact_phone?: string
          created_at?: string
          description?: string
          direction?: string
          features?: string[]
          floor?: number
          furnished?: boolean
          governorate_id?: string | null
          id?: string
          kitchens?: number
          listing_type?: Database["public"]["Enums"]["listing_type"]
          living_rooms?: number
          office_id: string
          ownership_type?: string
          payment_method?: string
          price?: number
          property_type?: string
          rooms?: number
          status?: string
          title: string
          total_floors?: number
          video_url?: string
          view?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          area_id?: string | null
          area_size?: number
          bathrooms?: number
          building_age?: number
          contact_phone?: string
          created_at?: string
          description?: string
          direction?: string
          features?: string[]
          floor?: number
          furnished?: boolean
          governorate_id?: string | null
          id?: string
          kitchens?: number
          listing_type?: Database["public"]["Enums"]["listing_type"]
          living_rooms?: number
          office_id?: string
          ownership_type?: string
          payment_method?: string
          price?: number
          property_type?: string
          rooms?: number
          status?: string
          title?: string
          total_floors?: number
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
      office_status: "pending" | "pending_review" | "approved" | "rejected"
      user_role: "user" | "office" | "admin"
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
      office_status: ["pending", "pending_review", "approved", "rejected"],
      user_role: ["user", "office", "admin"],
    },
  },
} as const

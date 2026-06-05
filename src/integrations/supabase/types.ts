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
      about_page: {
        Row: {
          body: string
          created_at: string
          cta_label: string
          cta_url: string
          id: string
          image_url: string | null
          singleton: boolean
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          id?: string
          image_url?: string | null
          singleton?: boolean
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          id?: string
          image_url?: string | null
          singleton?: boolean
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_knowledge: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          source: string
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          source?: string
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source?: string
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chatbot_settings: {
        Row: {
          avatar_url: string | null
          created_at: string
          greeting: string
          id: string
          name: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          greeting?: string
          id?: string
          name?: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          greeting?: string
          id?: string
          name?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          address: string
          created_at: string
          email: string
          footer_text: string
          id: string
          instagram: string
          map_embed_url: string
          phone: string
          singleton: boolean
          social_links: Json
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string
          created_at?: string
          email?: string
          footer_text?: string
          id?: string
          instagram?: string
          map_embed_url?: string
          phone?: string
          singleton?: boolean
          social_links?: Json
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          footer_text?: string
          id?: string
          instagram?: string
          map_embed_url?: string
          phone?: string
          singleton?: boolean
          social_links?: Json
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_position: string
          image_url: string | null
          images: Json
          is_published: boolean
          menu_href: string | null
          meta_description: string
          show_in_menu: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          image_position?: string
          image_url?: string | null
          images?: Json
          is_published?: boolean
          menu_href?: string | null
          meta_description?: string
          show_in_menu?: boolean
          slug: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_position?: string
          image_url?: string | null
          images?: Json
          is_published?: boolean
          menu_href?: string | null
          meta_description?: string
          show_in_menu?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          id: string
          poli: string
          time_end: string
          time_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          id?: string
          poli?: string
          time_end: string
          time_start: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          id?: string
          poli?: string
          time_end?: string
          time_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          specialty: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          specialty?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          specialty?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          badge1: string
          badge2: string
          created_at: string
          cta_text: string
          id: string
          logo_url: string | null
          overlay_color: string
          overlay_opacity: number
          singleton: boolean
          tagline: string
          title_line1: string
          title_line2: string
          updated_at: string
        }
        Insert: {
          badge1?: string
          badge2?: string
          created_at?: string
          cta_text?: string
          id?: string
          logo_url?: string | null
          overlay_color?: string
          overlay_opacity?: number
          singleton?: boolean
          tagline?: string
          title_line1?: string
          title_line2?: string
          updated_at?: string
        }
        Update: {
          badge1?: string
          badge2?: string
          created_at?: string
          cta_text?: string
          id?: string
          logo_url?: string | null
          overlay_color?: string
          overlay_opacity?: number
          singleton?: boolean
          tagline?: string
          title_line1?: string
          title_line2?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_settings: {
        Row: {
          autoplay: boolean
          autoplay_interval: number
          created_at: string
          id: string
          loop: boolean
          show_arrows: boolean
          show_dots: boolean
          singleton: boolean
          transition_effect: string
          updated_at: string
        }
        Insert: {
          autoplay?: boolean
          autoplay_interval?: number
          created_at?: string
          id?: string
          loop?: boolean
          show_arrows?: boolean
          show_dots?: boolean
          singleton?: boolean
          transition_effect?: string
          updated_at?: string
        }
        Update: {
          autoplay?: boolean
          autoplay_interval?: number
          created_at?: string
          id?: string
          loop?: boolean
          show_arrows?: boolean
          show_dots?: boolean
          singleton?: boolean
          transition_effect?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          cta_link: string | null
          cta_text: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          caption: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          permalink: string
          shortcode: string
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          permalink: string
          shortcode: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          permalink?: string
          shortcode?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          display_order: number
          href: string
          id: string
          is_active: boolean
          label: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          href?: string
          id?: string
          is_active?: boolean
          label: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      page_menu_items: {
        Row: {
          created_at: string
          display_order: number
          href: string
          id: string
          is_active: boolean
          label: string
          page_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          href?: string
          id?: string
          is_active?: boolean
          label: string
          page_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          page_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_menu_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "custom_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          link: string | null
          logo_url: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link?: string | null
          logo_url: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link?: string | null
          logo_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          content: string
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          accent_color: string
          accent_foreground: string
          background_color: string
          border_color: string
          created_at: string
          destructive_color: string
          foreground_color: string
          gold_color: string
          id: string
          muted_color: string
          muted_foreground: string
          primary_color: string
          primary_dark: string
          primary_foreground: string
          ring_color: string
          secondary_color: string
          secondary_foreground: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          accent_color?: string
          accent_foreground?: string
          background_color?: string
          border_color?: string
          created_at?: string
          destructive_color?: string
          foreground_color?: string
          gold_color?: string
          id?: string
          muted_color?: string
          muted_foreground?: string
          primary_color?: string
          primary_dark?: string
          primary_foreground?: string
          ring_color?: string
          secondary_color?: string
          secondary_foreground?: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          accent_color?: string
          accent_foreground?: string
          background_color?: string
          border_color?: string
          created_at?: string
          destructive_color?: string
          foreground_color?: string
          gold_color?: string
          id?: string
          muted_color?: string
          muted_foreground?: string
          primary_color?: string
          primary_dark?: string
          primary_foreground?: string
          ring_color?: string
          secondary_color?: string
          secondary_foreground?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visiting_hours: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string
          time_range: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          time_range: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          time_range?: string
          updated_at?: string
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const

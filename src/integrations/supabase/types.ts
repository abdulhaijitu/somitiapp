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
      addon_configs: {
        Row: {
          addon_type: Database["public"]["Enums"]["addon_type"]
          created_at: string
          description: string | null
          description_bn: string | null
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
          price: number
          quantity: number
          sort_order: number | null
          unit: string
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          addon_type: Database["public"]["Enums"]["addon_type"]
          created_at?: string
          description?: string | null
          description_bn?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
          price: number
          quantity: number
          sort_order?: number | null
          unit: string
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          addon_type?: Database["public"]["Enums"]["addon_type"]
          created_at?: string
          description?: string | null
          description_bn?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
          price?: number
          quantity?: number
          sort_order?: number | null
          unit?: string
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          joined_at: string | null
          member_number: string | null
          monthly_amount: number | null
          name: string
          name_bn: string | null
          phone: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          joined_at?: string | null
          member_number?: string | null
          monthly_amount?: number | null
          name: string
          name_bn?: string | null
          phone?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          joined_at?: string | null
          member_number?: string | null
          monthly_amount?: number | null
          name?: string
          name_bn?: string | null
          phone?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          admin_alert_on_failed_payment: boolean | null
          admin_alert_on_high_overdue: boolean | null
          created_at: string
          dues_reminder_day: number | null
          dues_reminder_enabled: boolean | null
          high_overdue_threshold: number | null
          id: string
          overdue_reminder_enabled: boolean | null
          overdue_reminder_frequency_days: number | null
          payment_failed_sms: boolean | null
          payment_success_sms: boolean | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          admin_alert_on_failed_payment?: boolean | null
          admin_alert_on_high_overdue?: boolean | null
          created_at?: string
          dues_reminder_day?: number | null
          dues_reminder_enabled?: boolean | null
          high_overdue_threshold?: number | null
          id?: string
          overdue_reminder_enabled?: boolean | null
          overdue_reminder_frequency_days?: number | null
          payment_failed_sms?: boolean | null
          payment_success_sms?: boolean | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          admin_alert_on_failed_payment?: boolean | null
          admin_alert_on_high_overdue?: boolean | null
          created_at?: string
          dues_reminder_day?: number | null
          dues_reminder_enabled?: boolean | null
          high_overdue_threshold?: number | null
          id?: string
          overdue_reminder_enabled?: boolean | null
          overdue_reminder_frequency_days?: number | null
          payment_failed_sms?: boolean | null
          payment_success_sms?: boolean | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          member_id: string | null
          message: string
          message_bn: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          tenant_id: string
          title: string
          title_bn: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          member_id?: string | null
          message: string
          message_bn?: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          tenant_id: string
          title: string
          title_bn?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          member_id?: string | null
          message?: string
          message_bn?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          tenant_id?: string
          title?: string
          title_bn?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          new_status: Database["public"]["Enums"]["payment_status"] | null
          payment_id: string
          performed_by: string | null
          previous_status: Database["public"]["Enums"]["payment_status"] | null
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_id: string
          performed_by?: string | null
          previous_status?: Database["public"]["Enums"]["payment_status"] | null
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_id?: string
          performed_by?: string | null
          previous_status?: Database["public"]["Enums"]["payment_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          charged_amount: number | null
          created_at: string
          fee: number | null
          id: string
          invoice_id: string | null
          member_id: string
          metadata: Json | null
          notes: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_type: string
          payment_url: string | null
          period_month: number | null
          period_year: number | null
          reference: string | null
          sender_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          transaction_id: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          charged_amount?: number | null
          created_at?: string
          fee?: number | null
          id?: string
          invoice_id?: string | null
          member_id: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_type?: string
          payment_url?: string | null
          period_month?: number | null
          period_year?: number | null
          reference?: string | null
          sender_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          charged_amount?: number | null
          created_at?: string
          fee?: number | null
          id?: string
          invoice_id?: string | null
          member_id?: string
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_type?: string
          payment_url?: string | null
          period_month?: number | null
          period_year?: number | null
          reference?: string | null
          sender_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_configs: {
        Row: {
          advanced_reports: boolean | null
          created_at: string
          description: string | null
          description_bn: string | null
          early_access_features: boolean | null
          id: string
          is_popular: boolean | null
          max_members: number
          max_members_unlimited: boolean | null
          monthly_price: number
          name: string
          name_bn: string | null
          online_payments_enabled: boolean | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          report_history_months: number
          sms_monthly_quota: number
          sort_order: number | null
          updated_at: string
          yearly_price: number | null
        }
        Insert: {
          advanced_reports?: boolean | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          early_access_features?: boolean | null
          id?: string
          is_popular?: boolean | null
          max_members?: number
          max_members_unlimited?: boolean | null
          monthly_price?: number
          name: string
          name_bn?: string | null
          online_payments_enabled?: boolean | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          report_history_months?: number
          sms_monthly_quota?: number
          sort_order?: number | null
          updated_at?: string
          yearly_price?: number | null
        }
        Update: {
          advanced_reports?: boolean | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          early_access_features?: boolean | null
          id?: string
          is_popular?: boolean | null
          max_members?: number
          max_members_unlimited?: boolean | null
          monthly_price?: number
          name?: string
          name_bn?: string | null
          online_payments_enabled?: boolean | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          report_history_months?: number
          sms_monthly_quota?: number
          sort_order?: number | null
          updated_at?: string
          yearly_price?: number | null
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          cost: number | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          member_id: string | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          phone_number: string
          provider: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          member_id?: string | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          phone_number: string
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          member_id?: string | null
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          phone_number?: string
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_rate_limits: {
        Row: {
          created_at: string
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          phone_number: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          phone_number: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          phone_number?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_addons: {
        Row: {
          addon_config_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          purchased_at: string
          quantity_purchased: number
          quantity_used: number | null
          tenant_id: string
        }
        Insert: {
          addon_config_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          quantity_purchased: number
          quantity_used?: number | null
          tenant_id: string
        }
        Update: {
          addon_config_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          purchased_at?: string
          quantity_purchased?: number
          quantity_used?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_addons_addon_config_id_fkey"
            columns: ["addon_config_id"]
            isOneToOne: false
            referencedRelation: "addon_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_custom_pricing: {
        Row: {
          created_at: string
          created_by: string | null
          custom_monthly_price: number | null
          custom_yearly_price: number | null
          discount_percentage: number | null
          discount_reason: string | null
          id: string
          tenant_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_monthly_price?: number | null
          custom_yearly_price?: number | null
          discount_percentage?: number | null
          discount_reason?: string | null
          id?: string
          tenant_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_monthly_price?: number | null
          custom_yearly_price?: number | null
          discount_percentage?: number | null
          discount_reason?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_custom_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usage: {
        Row: {
          id: string
          member_count: number | null
          sms_month_reset_at: string
          sms_used_this_month: number | null
          tenant_id: string
          total_payments_processed: number | null
          total_sms_sent: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          member_count?: number | null
          sms_month_reset_at?: string
          sms_used_this_month?: number | null
          tenant_id: string
          total_payments_processed?: number | null
          total_sms_sent?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          member_count?: number | null
          sms_month_reset_at?: string
          sms_used_this_month?: number | null
          tenant_id?: string
          total_payments_processed?: number | null
          total_sms_sent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          default_language: string
          deleted_at: string | null
          id: string
          name: string
          name_bn: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_language?: string
          deleted_at?: string | null
          id?: string
          name: string
          name_bn?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_language?: string
          deleted_at?: string | null
          id?: string
          name?: string
          name_bn?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tenant_limit: {
        Args: { _limit_type: string; _tenant_id: string }
        Returns: Json
      }
      get_tenant_by_subdomain: {
        Args: { _subdomain: string }
        Returns: {
          created_at: string
          default_language: string
          deleted_at: string | null
          id: string
          name: string
          name_bn: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_tenant_plan_limits: { Args: { _tenant_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      user_tenant_id: { Args: { _user_id: string }; Returns: string }
      validate_tenant_subscription: {
        Args: { _tenant_id: string }
        Returns: Json
      }
    }
    Enums: {
      addon_type:
        | "sms_bundle"
        | "member_pack"
        | "report_history"
        | "custom_module"
      app_role: "super_admin" | "admin" | "manager" | "member"
      delivery_status: "pending" | "sent" | "delivered" | "failed" | "read"
      notification_channel: "sms" | "in_app" | "email"
      notification_type:
        | "otp"
        | "payment_success"
        | "payment_failed"
        | "payment_reminder"
        | "dues_reminder"
        | "system_alert"
        | "admin_alert"
      payment_method:
        | "offline"
        | "bkash"
        | "nagad"
        | "rocket"
        | "card"
        | "other"
      payment_status: "pending" | "paid" | "failed" | "cancelled" | "refunded"
      subscription_plan: "starter" | "standard" | "premium" | "custom"
      subscription_status: "active" | "expired" | "cancelled"
      tenant_status: "active" | "suspended" | "deleted"
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
      addon_type: [
        "sms_bundle",
        "member_pack",
        "report_history",
        "custom_module",
      ],
      app_role: ["super_admin", "admin", "manager", "member"],
      delivery_status: ["pending", "sent", "delivered", "failed", "read"],
      notification_channel: ["sms", "in_app", "email"],
      notification_type: [
        "otp",
        "payment_success",
        "payment_failed",
        "payment_reminder",
        "dues_reminder",
        "system_alert",
        "admin_alert",
      ],
      payment_method: ["offline", "bkash", "nagad", "rocket", "card", "other"],
      payment_status: ["pending", "paid", "failed", "cancelled", "refunded"],
      subscription_plan: ["starter", "standard", "premium", "custom"],
      subscription_status: ["active", "expired", "cancelled"],
      tenant_status: ["active", "suspended", "deleted"],
    },
  },
} as const

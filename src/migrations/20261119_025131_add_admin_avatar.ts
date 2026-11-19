import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_manager_info_gender" AS ENUM('male', 'female');
  CREATE TYPE "public"."enum_manager_info_avatar_mode" AS ENUM('initials', 'upload', 'preset');
  CREATE TYPE "public"."enum_employment_details_employment_status" AS ENUM('employed', 'self_employed', 'not_employed', 'notice_period');
  CREATE TYPE "public"."enum_employment_details_employment_type" AS ENUM('permanent', 'fixed_term', 'consultant', 'hourly', 'other');
  CREATE TYPE "public"."enum_employment_details_work_arrangement" AS ENUM('onsite', 'hybrid', 'remote');
  CREATE TYPE "public"."enum_employment_details_notice_period" AS ENUM('none', '1_month', '2_months', '3_months', '6_months', 'other');
  CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'inactive', 'pending');
  CREATE TYPE "public"."enum_employee_invitations_status" AS ENUM('pending', 'accepted', 'declined');
  CREATE TYPE "public"."enum_employee_invitations_revoked_by" AS ENUM('manager', 'employee');
  CREATE TYPE "public"."enum_employee_hr_info_upcoming_events_event_type" AS ENUM('meeting', 'review', 'training', 'other');
  CREATE TYPE "public"."enum_employee_hr_info_employment_info_employment_type" AS ENUM('full-time', 'part-time', 'contract', 'intern');
  CREATE TYPE "public"."enum_employee_hr_info_employment_info_status" AS ENUM('active', 'on-leave', 'terminated');
  CREATE TYPE "public"."enum_employee_contracts_history_type" AS ENUM('created', 'sent', 'signed', 'manager_signed', 'renewed', 'extended', 'terminated', 'ai_drafted');
  CREATE TYPE "public"."enum_employee_contracts_status" AS ENUM('draft', 'pending_signature', 'pending_manager_signature', 'active', 'terminated');
  CREATE TYPE "public"."enum_employee_contracts_contract_type" AS ENUM('permanent', 'temporary', 'on_call', 'consultant');
  CREATE TYPE "public"."enum_employee_contracts_employment_extent" AS ENUM('full_time', 'part_time');
  CREATE TYPE "public"."enum_employee_contracts_signing_method" AS ENUM('bankid', 'verocv');
  CREATE TYPE "public"."enum_contract_pdfs_kind" AS ENUM('preview', 'sent', 'signed');
  CREATE TYPE "public"."enum_contract_documents_ai_drafts_mode" AS ENUM('ai_scratch', 'from_template', 'ai_with_templates');
  CREATE TYPE "public"."enum_contract_documents_contract_status" AS ENUM('draft', 'pending_signature', 'pending_manager_signature', 'active', 'terminated');
  CREATE TYPE "public"."enum_contract_documents_notice_period" AS ENUM('1_month', '2_months', '3_months');
  CREATE TYPE "public"."enum_contract_documents_pay_day" AS ENUM('25th', 'last_business_day');
  CREATE TYPE "public"."enum_contract_documents_vacation_days_per_year" AS ENUM('25', '28', '30');
  CREATE TYPE "public"."enum_contract_documents_has_collective_agreement" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_interviews_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');
  CREATE TYPE "public"."enum_interviews_format" AS ENUM('video', 'phone', 'in_person');
  CREATE TYPE "public"."enum_interviews_evaluation_recommendation" AS ENUM('strong_yes', 'yes', 'maybe', 'no', 'strong_no');
  CREATE TYPE "public"."enum_manager_delegations_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled', 'ended');
  CREATE TYPE "public"."enum_manager_delegations_reason" AS ENUM('sick', 'vacation', 'parental', 'travel', 'other');
  CREATE TYPE "public"."enum_manager_delegations_ended_by" AS ENUM('owner', 'delegate');
  CREATE TYPE "public"."enum_user_presence_status" AS ENUM('available', 'busy', 'in_meeting', 'away', 'out_of_office', 'not_available', 'offline');
  CREATE TYPE "public"."enum_manager_deletions_reason" AS ENUM('fired', 'left_job', 'contract_ended', 'created_by_mistake', 'other');
  CREATE TYPE "public"."enum_manager_availability_weekly_day" AS ENUM('1', '2', '3', '4', '5', '6', '7');
  CREATE TYPE "public"."enum_manager_availability_weekly_mode" AS ENUM('available', 'partial', 'off');
  CREATE TYPE "public"."enum_manager_availability_status" AS ENUM('auto', 'available', 'limited', 'unavailable');
  CREATE TYPE "public"."enum_time_off_requests_type" AS ENUM('vacation', 'sick', 'vab', 'parental', 'comp_time', 'leave', 'training', 'other');
  CREATE TYPE "public"."enum_time_off_requests_half_day" AS ENUM('none', 'am', 'pm');
  CREATE TYPE "public"."enum_time_off_requests_status" AS ENUM('pending', 'approved', 'declined', 'cancelled');
  ALTER TYPE "public"."enum_profiles_language" ADD VALUE 'sv' BEFORE 'es';
  ALTER TYPE "public"."enum_employment_details_employment_rate" ADD VALUE '75%' BEFORE '70%';
  ALTER TYPE "public"."enum_employment_details_employment_rate" ADD VALUE '25%' BEFORE '20%';
  ALTER TYPE "public"."enum_employment_details_can_travel" ADD VALUE 'Sometimes';
  ALTER TYPE "public"."enum_employment_details_assignment_abroad" ADD VALUE 'Depends';
  ALTER TYPE "public"."enum_users_roles" ADD VALUE 'client-admin' BEFORE 'client';
  ALTER TYPE "public"."enum_users_roles" ADD VALUE 'client-manager' BEFORE 'client';
  CREATE TABLE "business_admin_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"first_name" varchar,
  	"last_name" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"job_title" varchar,
  	"avatar_upload_image_id" integer,
  	"avatar_static_image" varchar,
  	"company_company_name" varchar,
  	"company_org_number" varchar,
  	"company_industry" varchar,
  	"company_company_size" varchar,
  	"company_company_email" varchar,
  	"company_company_phone" varchar,
  	"company_company_website" varchar,
  	"company_company_address" varchar,
  	"company_company_logo_upload_image_id" integer,
  	"company_company_logo_static_image" varchar,
  	"notification_preferences_email_notif" boolean DEFAULT true,
  	"notification_preferences_new_manager_notif" boolean DEFAULT true,
  	"notification_preferences_placement_alert" boolean DEFAULT true,
  	"notification_preferences_weekly_report" boolean DEFAULT false,
  	"two_factor_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "manager_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"first_name" varchar,
  	"last_name" varchar,
  	"email" varchar,
  	"private_email" varchar,
  	"phone" varchar,
  	"mobile_phone" varchar,
  	"job_title" varchar,
  	"home_address" varchar,
  	"gender" "enum_manager_info_gender",
  	"professional_bio" varchar,
  	"avatar_mode" "enum_manager_info_avatar_mode" DEFAULT 'initials',
  	"avatar_upload_image_id" integer,
  	"avatar_preset" varchar,
  	"emergency_contact_first_name" varchar,
  	"emergency_contact_last_name" varchar,
  	"emergency_contact_relationship" varchar,
  	"emergency_contact_email" varchar,
  	"emergency_contact_phone_number" varchar,
  	"department_company_name" varchar,
  	"department_department" varchar,
  	"department_dept_size" varchar,
  	"department_dept_focus" varchar,
  	"department_managed_since" timestamp(3) with time zone,
  	"department_dept_goals" varchar,
  	"notification_preferences_email_notif" boolean DEFAULT true,
  	"notification_preferences_cv_activity" boolean DEFAULT true,
  	"notification_preferences_placement_alert" boolean DEFAULT true,
  	"notification_preferences_weekly_digest" boolean DEFAULT false,
  	"notification_preferences_schedule_reminders" boolean DEFAULT true,
  	"preferences_timezone" varchar DEFAULT 'Europe/Stockholm',
  	"preferences_date_format" varchar DEFAULT 'YYYY-MM-DD',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "employee_invitations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"manager_id" integer NOT NULL,
  	"employee_id" integer NOT NULL,
  	"boss_name" varchar NOT NULL,
  	"company_name" varchar,
  	"employee_email" varchar NOT NULL,
  	"status" "enum_employee_invitations_status" DEFAULT 'pending' NOT NULL,
  	"responded_at" timestamp(3) with time zone,
  	"revoked_by" "enum_employee_invitations_revoked_by",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "employee_hr_info_upcoming_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"event_type" "enum_employee_hr_info_upcoming_events_event_type" DEFAULT 'meeting',
  	"notes" varchar
  );
  
  CREATE TABLE "employee_hr_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"employment_info_job_title" varchar,
  	"employment_info_department" varchar,
  	"employment_info_employment_type" "enum_employee_hr_info_employment_info_employment_type",
  	"employment_info_start_date" timestamp(3) with time zone,
  	"employment_info_status" "enum_employee_hr_info_employment_info_status" DEFAULT 'active',
  	"work_summary" varchar,
  	"leave_balance_vacation_days_total" numeric DEFAULT 25,
  	"leave_balance_vacation_days_used" numeric DEFAULT 0,
  	"leave_balance_sick_days_total" numeric DEFAULT 10,
  	"leave_balance_sick_days_used" numeric DEFAULT 0,
  	"leave_balance_other_leave_days" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "employee_contracts_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_employee_contracts_history_type" NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "employee_contracts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"status" "enum_employee_contracts_status" DEFAULT 'draft',
  	"manager_id" integer,
  	"employee_id" integer,
  	"recipient_email" varchar,
  	"employee_name" varchar,
  	"employee_initials" varchar,
  	"employee_title" varchar,
  	"contract_type" "enum_employee_contracts_contract_type" DEFAULT 'permanent' NOT NULL,
  	"employment_extent" "enum_employee_contracts_employment_extent" DEFAULT 'full_time' NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"signing_method" "enum_employee_contracts_signing_method",
  	"signed_at" timestamp(3) with time zone,
  	"signed_by_name" varchar,
  	"signature_typed_name" varchar,
  	"signature_data_url" varchar,
  	"bank_id_signed_at" timestamp(3) with time zone,
  	"manager_signed_at" timestamp(3) with time zone,
  	"manager_signed_by_name" varchar,
  	"manager_signature_typed_name" varchar,
  	"manager_signature_data_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contract_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "contract_pdfs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contract_id" integer NOT NULL,
  	"kind" "enum_contract_pdfs_kind" DEFAULT 'preview' NOT NULL,
  	"version" numeric,
  	"contract_status_at_upload" varchar,
  	"manager_id" integer,
  	"employee_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "contract_documents_ai_drafts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_contract_documents_ai_drafts_mode" NOT NULL,
  	"prompt" varchar,
  	"generated_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contract_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contract_id" integer NOT NULL,
  	"manager_id" integer,
  	"employee_id" integer,
  	"contract_status" "enum_contract_documents_contract_status" DEFAULT 'draft',
  	"company_name" varchar,
  	"org_number" varchar,
  	"company_address" varchar,
  	"contact_person" varchar,
  	"personal_number" varchar,
  	"employee_address" varchar,
  	"position_title" varchar,
  	"workplace" varchar,
  	"notice_period" "enum_contract_documents_notice_period",
  	"monthly_salary_amount" varchar,
  	"pay_day" "enum_contract_documents_pay_day",
  	"vacation_days_per_year" "enum_contract_documents_vacation_days_per_year",
  	"other_benefits" varchar,
  	"other_notes" varchar,
  	"has_collective_agreement" "enum_contract_documents_has_collective_agreement",
  	"signing_place" varchar,
  	"signing_date" timestamp(3) with time zone,
  	"company_logo" varchar,
  	"sections" jsonb DEFAULT '{}'::jsonb,
  	"document_style_heading_font" varchar,
  	"document_style_heading_color" varchar DEFAULT '#051650',
  	"document_style_heading_size" numeric DEFAULT 13,
  	"document_style_heading_bold" boolean DEFAULT true,
  	"document_style_body_font" varchar,
  	"document_style_body_color" varchar DEFAULT '#1f2937',
  	"document_style_body_size" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contract_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"contract_templates_id" integer
  );
  
  CREATE TABLE "google_calendar_connections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"google_email" varchar,
  	"scope" varchar,
  	"connected_at" timestamp(3) with time zone,
  	"refresh_token_enc" varchar,
  	"access_token_enc" varchar,
  	"access_token_expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "interviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_interviews_status" DEFAULT 'scheduled' NOT NULL,
  	"manager_id" integer,
  	"interviewer_name" varchar,
  	"completed_at" timestamp(3) with time zone,
  	"cancelled_at" timestamp(3) with time zone,
  	"rescheduled_at" timestamp(3) with time zone,
  	"previous_start_at" timestamp(3) with time zone,
  	"cancel_reason" varchar,
  	"candidate_name" varchar NOT NULL,
  	"candidate_email" varchar NOT NULL,
  	"candidate_phone" varchar,
  	"employee_id" integer,
  	"position" varchar NOT NULL,
  	"start_at" timestamp(3) with time zone NOT NULL,
  	"duration_minutes" numeric DEFAULT 45 NOT NULL,
  	"end_at" timestamp(3) with time zone,
  	"time_zone" varchar DEFAULT 'Europe/Stockholm',
  	"format" "enum_interviews_format" DEFAULT 'video' NOT NULL,
  	"location" varchar,
  	"meeting_link" varchar,
  	"message_to_candidate" varchar,
  	"notes" varchar,
  	"notes_updated_at" timestamp(3) with time zone,
  	"evaluation_technical_rating" numeric DEFAULT 0,
  	"evaluation_communication_rating" numeric DEFAULT 0,
  	"evaluation_culture_fit_rating" numeric DEFAULT 0,
  	"evaluation_overall_rating" numeric DEFAULT 0,
  	"evaluation_strengths" varchar,
  	"evaluation_weaknesses" varchar,
  	"evaluation_recommendation" "enum_interviews_evaluation_recommendation",
  	"evaluation_additional_comments" varchar,
  	"evaluation_evaluated_at" timestamp(3) with time zone,
  	"google_add_to_calendar" boolean DEFAULT true,
  	"google_send_invite" boolean DEFAULT true,
  	"google_event_id" varchar,
  	"google_calendar_email" varchar,
  	"google_html_link" varchar,
  	"google_synced_at" timestamp(3) with time zone,
  	"google_sync_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "manager_delegations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"delegate_id" integer NOT NULL,
  	"status" "enum_manager_delegations_status" DEFAULT 'pending' NOT NULL,
  	"reason" "enum_manager_delegations_reason" DEFAULT 'vacation',
  	"message" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"responded_at" timestamp(3) with time zone,
  	"ended_at" timestamp(3) with time zone,
  	"ended_by" "enum_manager_delegations_ended_by",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "chat_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"conversation_id" integer NOT NULL,
  	"sender_id" integer NOT NULL,
  	"body" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "chat_conversations_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"last_read_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "chat_conversations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"created_by_id" integer,
  	"last_message_at" timestamp(3) with time zone,
  	"last_message_body" varchar,
  	"last_message_sender_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_presence" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"status" "enum_user_presence_status" DEFAULT 'available' NOT NULL,
  	"message" varchar,
  	"until" timestamp(3) with time zone,
  	"last_seen_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "manager_deletions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"manager_name" varchar NOT NULL,
  	"manager_email" varchar,
  	"manager_id" numeric,
  	"reason" "enum_manager_deletions_reason" NOT NULL,
  	"note" varchar,
  	"deleted_by_id" integer,
  	"removed" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "manager_availability_weekly" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_manager_availability_weekly_day" NOT NULL,
  	"mode" "enum_manager_availability_weekly_mode" DEFAULT 'available' NOT NULL,
  	"start" varchar,
  	"end" varchar
  );
  
  CREATE TABLE "manager_availability" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"manager_id" integer NOT NULL,
  	"status" "enum_manager_availability_status" DEFAULT 'auto',
  	"status_note" varchar,
  	"status_until" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "time_off_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"manager_id" integer NOT NULL,
  	"approver_id" integer,
  	"type" "enum_time_off_requests_type" NOT NULL,
  	"start_date" varchar NOT NULL,
  	"end_date" varchar NOT NULL,
  	"half_day" "enum_time_off_requests_half_day" DEFAULT 'none',
  	"working_days" numeric,
  	"note" varchar,
  	"status" "enum_time_off_requests_status" DEFAULT 'pending' NOT NULL,
  	"decided_by_id" integer,
  	"decided_at" timestamp(3) with time zone,
  	"decision_note" varchar,
  	"cancelled_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_employment_details_fee_rate_type";
  CREATE TYPE "public"."enum_employment_details_fee_rate_type" AS ENUM('monthly', 'hourly', 'daily', 'weekly');
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate_type" SET DATA TYPE "public"."enum_employment_details_fee_rate_type" USING "fee_rate_type"::"public"."enum_employment_details_fee_rate_type";
  ALTER TABLE "employment_details" ALTER COLUMN "employment_rate" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "can_travel" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "office_location" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "employment_date" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "home_address" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "present_title" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "work_area" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "assignment_abroad" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "salary_level" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "salary_currency" SET DEFAULT 'SEK';
  ALTER TABLE "employment_details" ALTER COLUMN "salary_currency" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "fee_currency" SET DEFAULT 'SEK';
  ALTER TABLE "employment_details" ALTER COLUMN "fee_currency" DROP NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate_type" DROP NOT NULL;
  ALTER TABLE "personal_information" ADD COLUMN "emergency_contact_first_name" varchar;
  ALTER TABLE "personal_information" ADD COLUMN "emergency_contact_last_name" varchar;
  ALTER TABLE "personal_information" ADD COLUMN "emergency_contact_relationship" varchar;
  ALTER TABLE "personal_information" ADD COLUMN "emergency_contact_email" varchar;
  ALTER TABLE "personal_information" ADD COLUMN "emergency_contact_phone_number" varchar;
  ALTER TABLE "employment_details" ADD COLUMN "employment_status" "enum_employment_details_employment_status" DEFAULT 'employed';
  ALTER TABLE "employment_details" ADD COLUMN "employer_name" varchar;
  ALTER TABLE "employment_details" ADD COLUMN "employment_type" "enum_employment_details_employment_type";
  ALTER TABLE "employment_details" ADD COLUMN "employment_end_date" timestamp(3) with time zone;
  ALTER TABLE "employment_details" ADD COLUMN "work_arrangement" "enum_employment_details_work_arrangement";
  ALTER TABLE "employment_details" ADD COLUMN "notice_period" "enum_employment_details_notice_period";
  ALTER TABLE "employment_details" ADD COLUMN "available_from" timestamp(3) with time zone;
  ALTER TABLE "cvs" ADD COLUMN "hidden" boolean DEFAULT false;
  ALTER TABLE "portfolio" ADD COLUMN "hidden" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "access_level" varchar;
  ALTER TABLE "users" ADD COLUMN "status" "enum_users_status" DEFAULT 'active';
  ALTER TABLE "users" ADD COLUMN "created_by_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "business_admin_info_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "manager_info_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "employee_invitations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "employee_hr_info_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "employee_contracts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contract_templates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contract_pdfs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contract_documents_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "google_calendar_connections_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "interviews_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "manager_delegations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "chat_messages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "chat_conversations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_presence_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "manager_deletions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "manager_availability_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "time_off_requests_id" integer;
  ALTER TABLE "business_admin_info" ADD CONSTRAINT "business_admin_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "business_admin_info" ADD CONSTRAINT "business_admin_info_avatar_upload_image_id_media_id_fk" FOREIGN KEY ("avatar_upload_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "business_admin_info" ADD CONSTRAINT "business_admin_info_company_company_logo_upload_image_id_media_id_fk" FOREIGN KEY ("company_company_logo_upload_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manager_info" ADD CONSTRAINT "manager_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manager_info" ADD CONSTRAINT "manager_info_avatar_upload_image_id_media_id_fk" FOREIGN KEY ("avatar_upload_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employee_invitations" ADD CONSTRAINT "employee_invitations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employee_hr_info_upcoming_events" ADD CONSTRAINT "employee_hr_info_upcoming_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."employee_hr_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "employee_hr_info" ADD CONSTRAINT "employee_hr_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employee_contracts_history" ADD CONSTRAINT "employee_contracts_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."employee_contracts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_pdfs" ADD CONSTRAINT "contract_pdfs_contract_id_employee_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."employee_contracts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_pdfs" ADD CONSTRAINT "contract_pdfs_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_pdfs" ADD CONSTRAINT "contract_pdfs_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_documents_ai_drafts" ADD CONSTRAINT "contract_documents_ai_drafts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contract_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contract_id_employee_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."employee_contracts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contract_documents_rels" ADD CONSTRAINT "contract_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contract_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contract_documents_rels" ADD CONSTRAINT "contract_documents_rels_contract_templates_fk" FOREIGN KEY ("contract_templates_id") REFERENCES "public"."contract_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interviews" ADD CONSTRAINT "interviews_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interviews" ADD CONSTRAINT "interviews_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manager_delegations" ADD CONSTRAINT "manager_delegations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manager_delegations" ADD CONSTRAINT "manager_delegations_delegate_id_users_id_fk" FOREIGN KEY ("delegate_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "chat_conversations_members" ADD CONSTRAINT "chat_conversations_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "chat_conversations_members" ADD CONSTRAINT "chat_conversations_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_last_message_sender_id_users_id_fk" FOREIGN KEY ("last_message_sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_presence" ADD CONSTRAINT "user_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manager_deletions" ADD CONSTRAINT "manager_deletions_deleted_by_id_users_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "manager_availability_weekly" ADD CONSTRAINT "manager_availability_weekly_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."manager_availability"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "manager_availability" ADD CONSTRAINT "manager_availability_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "business_admin_info_user_idx" ON "business_admin_info" USING btree ("user_id");
  CREATE INDEX "business_admin_info_avatar_avatar_upload_image_idx" ON "business_admin_info" USING btree ("avatar_upload_image_id");
  CREATE INDEX "business_admin_info_company_company_logo_company_company_idx" ON "business_admin_info" USING btree ("company_company_logo_upload_image_id");
  CREATE INDEX "business_admin_info_updated_at_idx" ON "business_admin_info" USING btree ("updated_at");
  CREATE INDEX "business_admin_info_created_at_idx" ON "business_admin_info" USING btree ("created_at");
  CREATE UNIQUE INDEX "manager_info_user_idx" ON "manager_info" USING btree ("user_id");
  CREATE INDEX "manager_info_avatar_avatar_upload_image_idx" ON "manager_info" USING btree ("avatar_upload_image_id");
  CREATE INDEX "manager_info_updated_at_idx" ON "manager_info" USING btree ("updated_at");
  CREATE INDEX "manager_info_created_at_idx" ON "manager_info" USING btree ("created_at");
  CREATE INDEX "employee_invitations_manager_idx" ON "employee_invitations" USING btree ("manager_id");
  CREATE INDEX "employee_invitations_employee_idx" ON "employee_invitations" USING btree ("employee_id");
  CREATE INDEX "employee_invitations_updated_at_idx" ON "employee_invitations" USING btree ("updated_at");
  CREATE INDEX "employee_invitations_created_at_idx" ON "employee_invitations" USING btree ("created_at");
  CREATE INDEX "employee_hr_info_upcoming_events_order_idx" ON "employee_hr_info_upcoming_events" USING btree ("_order");
  CREATE INDEX "employee_hr_info_upcoming_events_parent_id_idx" ON "employee_hr_info_upcoming_events" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "employee_hr_info_user_idx" ON "employee_hr_info" USING btree ("user_id");
  CREATE INDEX "employee_hr_info_updated_at_idx" ON "employee_hr_info" USING btree ("updated_at");
  CREATE INDEX "employee_hr_info_created_at_idx" ON "employee_hr_info" USING btree ("created_at");
  CREATE INDEX "employee_contracts_history_order_idx" ON "employee_contracts_history" USING btree ("_order");
  CREATE INDEX "employee_contracts_history_parent_id_idx" ON "employee_contracts_history" USING btree ("_parent_id");
  CREATE INDEX "employee_contracts_status_idx" ON "employee_contracts" USING btree ("status");
  CREATE INDEX "employee_contracts_manager_idx" ON "employee_contracts" USING btree ("manager_id");
  CREATE INDEX "employee_contracts_employee_idx" ON "employee_contracts" USING btree ("employee_id");
  CREATE INDEX "employee_contracts_recipient_email_idx" ON "employee_contracts" USING btree ("recipient_email");
  CREATE INDEX "employee_contracts_updated_at_idx" ON "employee_contracts" USING btree ("updated_at");
  CREATE INDEX "employee_contracts_created_at_idx" ON "employee_contracts" USING btree ("created_at");
  CREATE INDEX "contract_templates_owner_idx" ON "contract_templates" USING btree ("owner_id");
  CREATE INDEX "contract_templates_updated_at_idx" ON "contract_templates" USING btree ("updated_at");
  CREATE INDEX "contract_templates_created_at_idx" ON "contract_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "contract_templates_filename_idx" ON "contract_templates" USING btree ("filename");
  CREATE INDEX "contract_pdfs_contract_idx" ON "contract_pdfs" USING btree ("contract_id");
  CREATE INDEX "contract_pdfs_kind_idx" ON "contract_pdfs" USING btree ("kind");
  CREATE INDEX "contract_pdfs_manager_idx" ON "contract_pdfs" USING btree ("manager_id");
  CREATE INDEX "contract_pdfs_employee_idx" ON "contract_pdfs" USING btree ("employee_id");
  CREATE INDEX "contract_pdfs_updated_at_idx" ON "contract_pdfs" USING btree ("updated_at");
  CREATE INDEX "contract_pdfs_created_at_idx" ON "contract_pdfs" USING btree ("created_at");
  CREATE UNIQUE INDEX "contract_pdfs_filename_idx" ON "contract_pdfs" USING btree ("filename");
  CREATE INDEX "contract_documents_ai_drafts_order_idx" ON "contract_documents_ai_drafts" USING btree ("_order");
  CREATE INDEX "contract_documents_ai_drafts_parent_id_idx" ON "contract_documents_ai_drafts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "contract_documents_contract_idx" ON "contract_documents" USING btree ("contract_id");
  CREATE INDEX "contract_documents_manager_idx" ON "contract_documents" USING btree ("manager_id");
  CREATE INDEX "contract_documents_employee_idx" ON "contract_documents" USING btree ("employee_id");
  CREATE INDEX "contract_documents_contract_status_idx" ON "contract_documents" USING btree ("contract_status");
  CREATE INDEX "contract_documents_updated_at_idx" ON "contract_documents" USING btree ("updated_at");
  CREATE INDEX "contract_documents_created_at_idx" ON "contract_documents" USING btree ("created_at");
  CREATE INDEX "contract_documents_rels_order_idx" ON "contract_documents_rels" USING btree ("order");
  CREATE INDEX "contract_documents_rels_parent_idx" ON "contract_documents_rels" USING btree ("parent_id");
  CREATE INDEX "contract_documents_rels_path_idx" ON "contract_documents_rels" USING btree ("path");
  CREATE INDEX "contract_documents_rels_contract_templates_id_idx" ON "contract_documents_rels" USING btree ("contract_templates_id");
  CREATE UNIQUE INDEX "google_calendar_connections_user_idx" ON "google_calendar_connections" USING btree ("user_id");
  CREATE INDEX "google_calendar_connections_updated_at_idx" ON "google_calendar_connections" USING btree ("updated_at");
  CREATE INDEX "google_calendar_connections_created_at_idx" ON "google_calendar_connections" USING btree ("created_at");
  CREATE INDEX "interviews_status_idx" ON "interviews" USING btree ("status");
  CREATE INDEX "interviews_manager_idx" ON "interviews" USING btree ("manager_id");
  CREATE INDEX "interviews_candidate_email_idx" ON "interviews" USING btree ("candidate_email");
  CREATE INDEX "interviews_employee_idx" ON "interviews" USING btree ("employee_id");
  CREATE INDEX "interviews_start_at_idx" ON "interviews" USING btree ("start_at");
  CREATE INDEX "interviews_google_google_event_id_idx" ON "interviews" USING btree ("google_event_id");
  CREATE INDEX "interviews_updated_at_idx" ON "interviews" USING btree ("updated_at");
  CREATE INDEX "interviews_created_at_idx" ON "interviews" USING btree ("created_at");
  CREATE INDEX "manager_delegations_owner_idx" ON "manager_delegations" USING btree ("owner_id");
  CREATE INDEX "manager_delegations_delegate_idx" ON "manager_delegations" USING btree ("delegate_id");
  CREATE INDEX "manager_delegations_status_idx" ON "manager_delegations" USING btree ("status");
  CREATE INDEX "manager_delegations_updated_at_idx" ON "manager_delegations" USING btree ("updated_at");
  CREATE INDEX "manager_delegations_created_at_idx" ON "manager_delegations" USING btree ("created_at");
  CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");
  CREATE INDEX "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");
  CREATE INDEX "chat_messages_updated_at_idx" ON "chat_messages" USING btree ("updated_at");
  CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");
  CREATE INDEX "chat_conversations_members_order_idx" ON "chat_conversations_members" USING btree ("_order");
  CREATE INDEX "chat_conversations_members_parent_id_idx" ON "chat_conversations_members" USING btree ("_parent_id");
  CREATE INDEX "chat_conversations_members_user_idx" ON "chat_conversations_members" USING btree ("user_id");
  CREATE UNIQUE INDEX "chat_conversations_key_idx" ON "chat_conversations" USING btree ("key");
  CREATE INDEX "chat_conversations_created_by_idx" ON "chat_conversations" USING btree ("created_by_id");
  CREATE INDEX "chat_conversations_last_message_at_idx" ON "chat_conversations" USING btree ("last_message_at");
  CREATE INDEX "chat_conversations_last_message_last_message_sender_idx" ON "chat_conversations" USING btree ("last_message_sender_id");
  CREATE INDEX "chat_conversations_updated_at_idx" ON "chat_conversations" USING btree ("updated_at");
  CREATE INDEX "chat_conversations_created_at_idx" ON "chat_conversations" USING btree ("created_at");
  CREATE UNIQUE INDEX "user_presence_user_idx" ON "user_presence" USING btree ("user_id");
  CREATE INDEX "user_presence_updated_at_idx" ON "user_presence" USING btree ("updated_at");
  CREATE INDEX "user_presence_created_at_idx" ON "user_presence" USING btree ("created_at");
  CREATE INDEX "manager_deletions_deleted_by_idx" ON "manager_deletions" USING btree ("deleted_by_id");
  CREATE INDEX "manager_deletions_updated_at_idx" ON "manager_deletions" USING btree ("updated_at");
  CREATE INDEX "manager_deletions_created_at_idx" ON "manager_deletions" USING btree ("created_at");
  CREATE INDEX "manager_availability_weekly_order_idx" ON "manager_availability_weekly" USING btree ("_order");
  CREATE INDEX "manager_availability_weekly_parent_id_idx" ON "manager_availability_weekly" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "manager_availability_manager_idx" ON "manager_availability" USING btree ("manager_id");
  CREATE INDEX "manager_availability_updated_at_idx" ON "manager_availability" USING btree ("updated_at");
  CREATE INDEX "manager_availability_created_at_idx" ON "manager_availability" USING btree ("created_at");
  CREATE INDEX "time_off_requests_manager_idx" ON "time_off_requests" USING btree ("manager_id");
  CREATE INDEX "time_off_requests_approver_idx" ON "time_off_requests" USING btree ("approver_id");
  CREATE INDEX "time_off_requests_start_date_idx" ON "time_off_requests" USING btree ("start_date");
  CREATE INDEX "time_off_requests_end_date_idx" ON "time_off_requests" USING btree ("end_date");
  CREATE INDEX "time_off_requests_status_idx" ON "time_off_requests" USING btree ("status");
  CREATE INDEX "time_off_requests_decided_by_idx" ON "time_off_requests" USING btree ("decided_by_id");
  CREATE INDEX "time_off_requests_decided_at_idx" ON "time_off_requests" USING btree ("decided_at");
  CREATE INDEX "time_off_requests_updated_at_idx" ON "time_off_requests" USING btree ("updated_at");
  CREATE INDEX "time_off_requests_created_at_idx" ON "time_off_requests" USING btree ("created_at");
  ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_business_admin_info_fk" FOREIGN KEY ("business_admin_info_id") REFERENCES "public"."business_admin_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manager_info_fk" FOREIGN KEY ("manager_info_id") REFERENCES "public"."manager_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_employee_invitations_fk" FOREIGN KEY ("employee_invitations_id") REFERENCES "public"."employee_invitations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_employee_hr_info_fk" FOREIGN KEY ("employee_hr_info_id") REFERENCES "public"."employee_hr_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_employee_contracts_fk" FOREIGN KEY ("employee_contracts_id") REFERENCES "public"."employee_contracts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contract_templates_fk" FOREIGN KEY ("contract_templates_id") REFERENCES "public"."contract_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contract_pdfs_fk" FOREIGN KEY ("contract_pdfs_id") REFERENCES "public"."contract_pdfs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contract_documents_fk" FOREIGN KEY ("contract_documents_id") REFERENCES "public"."contract_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_google_calendar_connections_fk" FOREIGN KEY ("google_calendar_connections_id") REFERENCES "public"."google_calendar_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_interviews_fk" FOREIGN KEY ("interviews_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manager_delegations_fk" FOREIGN KEY ("manager_delegations_id") REFERENCES "public"."manager_delegations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_messages_fk" FOREIGN KEY ("chat_messages_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_conversations_fk" FOREIGN KEY ("chat_conversations_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_presence_fk" FOREIGN KEY ("user_presence_id") REFERENCES "public"."user_presence"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manager_deletions_fk" FOREIGN KEY ("manager_deletions_id") REFERENCES "public"."manager_deletions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manager_availability_fk" FOREIGN KEY ("manager_availability_id") REFERENCES "public"."manager_availability"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_time_off_requests_fk" FOREIGN KEY ("time_off_requests_id") REFERENCES "public"."time_off_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_created_by_idx" ON "users" USING btree ("created_by_id");
  CREATE INDEX "payload_locked_documents_rels_business_admin_info_id_idx" ON "payload_locked_documents_rels" USING btree ("business_admin_info_id");
  CREATE INDEX "payload_locked_documents_rels_manager_info_id_idx" ON "payload_locked_documents_rels" USING btree ("manager_info_id");
  CREATE INDEX "payload_locked_documents_rels_employee_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("employee_invitations_id");
  CREATE INDEX "payload_locked_documents_rels_employee_hr_info_id_idx" ON "payload_locked_documents_rels" USING btree ("employee_hr_info_id");
  CREATE INDEX "payload_locked_documents_rels_employee_contracts_id_idx" ON "payload_locked_documents_rels" USING btree ("employee_contracts_id");
  CREATE INDEX "payload_locked_documents_rels_contract_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("contract_templates_id");
  CREATE INDEX "payload_locked_documents_rels_contract_pdfs_id_idx" ON "payload_locked_documents_rels" USING btree ("contract_pdfs_id");
  CREATE INDEX "payload_locked_documents_rels_contract_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("contract_documents_id");
  CREATE INDEX "payload_locked_documents_rels_google_calendar_connection_idx" ON "payload_locked_documents_rels" USING btree ("google_calendar_connections_id");
  CREATE INDEX "payload_locked_documents_rels_interviews_id_idx" ON "payload_locked_documents_rels" USING btree ("interviews_id");
  CREATE INDEX "payload_locked_documents_rels_manager_delegations_id_idx" ON "payload_locked_documents_rels" USING btree ("manager_delegations_id");
  CREATE INDEX "payload_locked_documents_rels_chat_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("chat_messages_id");
  CREATE INDEX "payload_locked_documents_rels_chat_conversations_id_idx" ON "payload_locked_documents_rels" USING btree ("chat_conversations_id");
  CREATE INDEX "payload_locked_documents_rels_user_presence_id_idx" ON "payload_locked_documents_rels" USING btree ("user_presence_id");
  CREATE INDEX "payload_locked_documents_rels_manager_deletions_id_idx" ON "payload_locked_documents_rels" USING btree ("manager_deletions_id");
  CREATE INDEX "payload_locked_documents_rels_manager_availability_id_idx" ON "payload_locked_documents_rels" USING btree ("manager_availability_id");
  CREATE INDEX "payload_locked_documents_rels_time_off_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("time_off_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "business_admin_info" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "manager_info" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "employee_invitations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "employee_hr_info_upcoming_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "employee_hr_info" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "employee_contracts_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "employee_contracts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_pdfs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_documents_ai_drafts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contract_documents_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "google_calendar_connections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "interviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "manager_delegations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chat_conversations_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chat_conversations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_presence" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "manager_deletions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "manager_availability_weekly" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "manager_availability" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "time_off_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "business_admin_info" CASCADE;
  DROP TABLE "manager_info" CASCADE;
  DROP TABLE "employee_invitations" CASCADE;
  DROP TABLE "employee_hr_info_upcoming_events" CASCADE;
  DROP TABLE "employee_hr_info" CASCADE;
  DROP TABLE "employee_contracts_history" CASCADE;
  DROP TABLE "employee_contracts" CASCADE;
  DROP TABLE "contract_templates" CASCADE;
  DROP TABLE "contract_pdfs" CASCADE;
  DROP TABLE "contract_documents_ai_drafts" CASCADE;
  DROP TABLE "contract_documents" CASCADE;
  DROP TABLE "contract_documents_rels" CASCADE;
  DROP TABLE "google_calendar_connections" CASCADE;
  DROP TABLE "interviews" CASCADE;
  DROP TABLE "manager_delegations" CASCADE;
  DROP TABLE "chat_messages" CASCADE;
  DROP TABLE "chat_conversations_members" CASCADE;
  DROP TABLE "chat_conversations" CASCADE;
  DROP TABLE "user_presence" CASCADE;
  DROP TABLE "manager_deletions" CASCADE;
  DROP TABLE "manager_availability_weekly" CASCADE;
  DROP TABLE "manager_availability" CASCADE;
  DROP TABLE "time_off_requests" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_created_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_business_admin_info_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_manager_info_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_employee_invitations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_employee_hr_info_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_employee_contracts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contract_templates_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contract_pdfs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contract_documents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_google_calendar_connections_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_interviews_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_manager_delegations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_chat_messages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_chat_conversations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_presence_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_manager_deletions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_manager_availability_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_time_off_requests_fk";
  
  ALTER TABLE "profiles" ALTER COLUMN "language" SET DATA TYPE text;
  ALTER TABLE "profiles" ALTER COLUMN "language" SET DEFAULT 'en'::text;
  DROP TYPE "public"."enum_profiles_language";
  CREATE TYPE "public"."enum_profiles_language" AS ENUM('en', 'es', 'fr', 'de', 'zh', 'ja');
  ALTER TABLE "profiles" ALTER COLUMN "language" SET DEFAULT 'en'::"public"."enum_profiles_language";
  ALTER TABLE "profiles" ALTER COLUMN "language" SET DATA TYPE "public"."enum_profiles_language" USING "language"::"public"."enum_profiles_language";
  ALTER TABLE "employment_details" ALTER COLUMN "employment_rate" SET DATA TYPE text;
  DROP TYPE "public"."enum_employment_details_employment_rate";
  CREATE TYPE "public"."enum_employment_details_employment_rate" AS ENUM('100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', '10%');
  ALTER TABLE "employment_details" ALTER COLUMN "employment_rate" SET DATA TYPE "public"."enum_employment_details_employment_rate" USING "employment_rate"::"public"."enum_employment_details_employment_rate";
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_employment_details_fee_rate_type";
  CREATE TYPE "public"."enum_employment_details_fee_rate_type" AS ENUM('hourly', 'daily', 'weekly', 'monthly');
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate_type" SET DATA TYPE "public"."enum_employment_details_fee_rate_type" USING "fee_rate_type"::"public"."enum_employment_details_fee_rate_type";
  ALTER TABLE "employment_details" ALTER COLUMN "can_travel" SET DATA TYPE text;
  DROP TYPE "public"."enum_employment_details_can_travel";
  CREATE TYPE "public"."enum_employment_details_can_travel" AS ENUM('Yes', 'No');
  ALTER TABLE "employment_details" ALTER COLUMN "can_travel" SET DATA TYPE "public"."enum_employment_details_can_travel" USING "can_travel"::"public"."enum_employment_details_can_travel";
  ALTER TABLE "employment_details" ALTER COLUMN "assignment_abroad" SET DATA TYPE text;
  DROP TYPE "public"."enum_employment_details_assignment_abroad";
  CREATE TYPE "public"."enum_employment_details_assignment_abroad" AS ENUM('Yes', 'No');
  ALTER TABLE "employment_details" ALTER COLUMN "assignment_abroad" SET DATA TYPE "public"."enum_employment_details_assignment_abroad" USING "assignment_abroad"::"public"."enum_employment_details_assignment_abroad";
  ALTER TABLE "users" ALTER COLUMN "roles" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT 'client'::text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'client');
  ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT 'client'::"public"."enum_users_roles";
  ALTER TABLE "users" ALTER COLUMN "roles" SET DATA TYPE "public"."enum_users_roles" USING "roles"::"public"."enum_users_roles";
  DROP INDEX "users_created_by_idx";
  DROP INDEX "payload_locked_documents_rels_business_admin_info_id_idx";
  DROP INDEX "payload_locked_documents_rels_manager_info_id_idx";
  DROP INDEX "payload_locked_documents_rels_employee_invitations_id_idx";
  DROP INDEX "payload_locked_documents_rels_employee_hr_info_id_idx";
  DROP INDEX "payload_locked_documents_rels_employee_contracts_id_idx";
  DROP INDEX "payload_locked_documents_rels_contract_templates_id_idx";
  DROP INDEX "payload_locked_documents_rels_contract_pdfs_id_idx";
  DROP INDEX "payload_locked_documents_rels_contract_documents_id_idx";
  DROP INDEX "payload_locked_documents_rels_google_calendar_connection_idx";
  DROP INDEX "payload_locked_documents_rels_interviews_id_idx";
  DROP INDEX "payload_locked_documents_rels_manager_delegations_id_idx";
  DROP INDEX "payload_locked_documents_rels_chat_messages_id_idx";
  DROP INDEX "payload_locked_documents_rels_chat_conversations_id_idx";
  DROP INDEX "payload_locked_documents_rels_user_presence_id_idx";
  DROP INDEX "payload_locked_documents_rels_manager_deletions_id_idx";
  DROP INDEX "payload_locked_documents_rels_manager_availability_id_idx";
  DROP INDEX "payload_locked_documents_rels_time_off_requests_id_idx";
  ALTER TABLE "employment_details" ALTER COLUMN "present_title" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "work_area" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "employment_date" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "employment_rate" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "office_location" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "home_address" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "salary_level" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "salary_currency" DROP DEFAULT;
  ALTER TABLE "employment_details" ALTER COLUMN "salary_currency" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "fee_currency" DROP DEFAULT;
  ALTER TABLE "employment_details" ALTER COLUMN "fee_currency" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "fee_rate_type" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "can_travel" SET NOT NULL;
  ALTER TABLE "employment_details" ALTER COLUMN "assignment_abroad" SET NOT NULL;
  ALTER TABLE "personal_information" DROP COLUMN "emergency_contact_first_name";
  ALTER TABLE "personal_information" DROP COLUMN "emergency_contact_last_name";
  ALTER TABLE "personal_information" DROP COLUMN "emergency_contact_relationship";
  ALTER TABLE "personal_information" DROP COLUMN "emergency_contact_email";
  ALTER TABLE "personal_information" DROP COLUMN "emergency_contact_phone_number";
  ALTER TABLE "employment_details" DROP COLUMN "employment_status";
  ALTER TABLE "employment_details" DROP COLUMN "employer_name";
  ALTER TABLE "employment_details" DROP COLUMN "employment_type";
  ALTER TABLE "employment_details" DROP COLUMN "employment_end_date";
  ALTER TABLE "employment_details" DROP COLUMN "work_arrangement";
  ALTER TABLE "employment_details" DROP COLUMN "notice_period";
  ALTER TABLE "employment_details" DROP COLUMN "available_from";
  ALTER TABLE "cvs" DROP COLUMN "hidden";
  ALTER TABLE "portfolio" DROP COLUMN "hidden";
  ALTER TABLE "users" DROP COLUMN "access_level";
  ALTER TABLE "users" DROP COLUMN "status";
  ALTER TABLE "users" DROP COLUMN "created_by_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "business_admin_info_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "manager_info_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "employee_invitations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "employee_hr_info_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "employee_contracts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contract_templates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contract_pdfs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contract_documents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "google_calendar_connections_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "interviews_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "manager_delegations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "chat_messages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "chat_conversations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_presence_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "manager_deletions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "manager_availability_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "time_off_requests_id";
  DROP TYPE "public"."enum_manager_info_gender";
  DROP TYPE "public"."enum_manager_info_avatar_mode";
  DROP TYPE "public"."enum_employment_details_employment_status";
  DROP TYPE "public"."enum_employment_details_employment_type";
  DROP TYPE "public"."enum_employment_details_work_arrangement";
  DROP TYPE "public"."enum_employment_details_notice_period";
  DROP TYPE "public"."enum_users_status";
  DROP TYPE "public"."enum_employee_invitations_status";
  DROP TYPE "public"."enum_employee_invitations_revoked_by";
  DROP TYPE "public"."enum_employee_hr_info_upcoming_events_event_type";
  DROP TYPE "public"."enum_employee_hr_info_employment_info_employment_type";
  DROP TYPE "public"."enum_employee_hr_info_employment_info_status";
  DROP TYPE "public"."enum_employee_contracts_history_type";
  DROP TYPE "public"."enum_employee_contracts_status";
  DROP TYPE "public"."enum_employee_contracts_contract_type";
  DROP TYPE "public"."enum_employee_contracts_employment_extent";
  DROP TYPE "public"."enum_employee_contracts_signing_method";
  DROP TYPE "public"."enum_contract_pdfs_kind";
  DROP TYPE "public"."enum_contract_documents_ai_drafts_mode";
  DROP TYPE "public"."enum_contract_documents_contract_status";
  DROP TYPE "public"."enum_contract_documents_notice_period";
  DROP TYPE "public"."enum_contract_documents_pay_day";
  DROP TYPE "public"."enum_contract_documents_vacation_days_per_year";
  DROP TYPE "public"."enum_contract_documents_has_collective_agreement";
  DROP TYPE "public"."enum_interviews_status";
  DROP TYPE "public"."enum_interviews_format";
  DROP TYPE "public"."enum_interviews_evaluation_recommendation";
  DROP TYPE "public"."enum_manager_delegations_status";
  DROP TYPE "public"."enum_manager_delegations_reason";
  DROP TYPE "public"."enum_manager_delegations_ended_by";
  DROP TYPE "public"."enum_user_presence_status";
  DROP TYPE "public"."enum_manager_deletions_reason";
  DROP TYPE "public"."enum_manager_availability_weekly_day";
  DROP TYPE "public"."enum_manager_availability_weekly_mode";
  DROP TYPE "public"."enum_manager_availability_status";
  DROP TYPE "public"."enum_time_off_requests_type";
  DROP TYPE "public"."enum_time_off_requests_half_day";
  DROP TYPE "public"."enum_time_off_requests_status";`)
}

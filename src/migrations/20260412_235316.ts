import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_job_applications_employment_type" AS ENUM('Privat/Egenkonsult', 'Konsultbolag/Konsultförmedlare');
  CREATE TYPE "public"."enum_job_applications_desired_employment_percentage" AS ENUM('Full_time_100', 'Part_time_75', 'Part_time_50', 'Part_time_25', 'Internship_20', 'Freelance_Contract_variable');
  CREATE TYPE "public"."enum_profiles_profile_details_certifications_type" AS ENUM('certificate', 'course');
  CREATE TYPE "public"."enum_profiles_language" AS ENUM('en', 'es', 'fr', 'de', 'zh', 'ja');
  CREATE TYPE "public"."enum_personal_information_gender" AS ENUM('male', 'female', 'other');
  CREATE TYPE "public"."enum_availability_date_status_status" AS ENUM('booked', 'available', 'vacation', 'none');
  CREATE TYPE "public"."enum_employment_details_employment_rate" AS ENUM('100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', '10%');
  CREATE TYPE "public"."enum_employment_details_can_travel" AS ENUM('Yes', 'No');
  CREATE TYPE "public"."enum_employment_details_assignment_abroad" AS ENUM('Yes', 'No');
  CREATE TYPE "public"."enum_employment_details_salary_currency" AS ENUM('SEK', 'EUR', 'USD', 'GBP', 'NOK', 'DKK');
  CREATE TYPE "public"."enum_employment_details_fee_currency" AS ENUM('SEK', 'EUR', 'USD', 'GBP', 'NOK', 'DKK');
  CREATE TYPE "public"."enum_employment_details_fee_rate_type" AS ENUM('hourly', 'daily', 'weekly', 'monthly');
  CREATE TYPE "public"."enum_cvs_languages_level" AS ENUM('beginner', 'intermediate', 'advanced', 'fluent', 'native');
  CREATE TYPE "public"."enum_cvs_certifications_type" AS ENUM('certificate', 'course');
  CREATE TYPE "public"."enum_cvs_personal_info_gender" AS ENUM('male', 'female', 'other');
  CREATE TYPE "public"."enum_cvs_template" AS ENUM('modern', 'classic', 'minimalist', 'ats');
  CREATE TYPE "public"."enum_cover_letters_tone" AS ENUM('professional', 'enthusiastic', 'formal', 'casual');
  CREATE TYPE "public"."enum_portfolio_type" AS ENUM('image', 'video', 'youtube', 'link', 'document');
  CREATE TYPE "public"."enum_portfolio_document_ext" AS ENUM('pdf', 'docx', 'doc', 'pptx', 'ppt');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'client');
  CREATE TYPE "public"."enum_users_auth_type" AS ENUM('credentials', 'google', 'linkedin', 'github');
  CREATE TABLE "job_ads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"company" varchar NOT NULL,
  	"location" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"job_id" numeric NOT NULL,
  	"shortdescription" varchar NOT NULL,
  	"fulldescription" jsonb NOT NULL,
  	"confirmation_email" jsonb,
  	"mass_email" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "job_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"job_id_id" integer NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"employment_type" "enum_job_applications_employment_type" NOT NULL,
  	"personal_number" varchar NOT NULL,
  	"has_foreign_personal_number" boolean DEFAULT false,
  	"has_foreign_address" boolean DEFAULT false,
  	"residence" varchar NOT NULL,
  	"city" varchar NOT NULL,
  	"postal_code" varchar NOT NULL,
  	"co_address" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"linkedin" varchar,
  	"current_position" varchar NOT NULL,
  	"job_category" varchar NOT NULL,
  	"desired_employment_percentage" "enum_job_applications_desired_employment_percentage" NOT NULL,
  	"availability_date" timestamp(3) with time zone NOT NULL,
  	"primary_assignment" varchar NOT NULL,
  	"secondary_assignment" varchar,
  	"found_ad" varchar NOT NULL,
  	"takes_assignment_abroad" boolean DEFAULT false,
  	"cv_id" integer NOT NULL,
  	"cover_letter_id" integer,
  	"message" varchar,
  	"consent" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "profiles_profile_details_project_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"is_current" boolean DEFAULT false,
  	"description" varchar NOT NULL,
  	"skills" varchar,
  	"company" varchar,
  	"location" varchar,
  	"project_url" varchar
  );
  
  CREATE TABLE "profiles_profile_details_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"skill_name" varchar NOT NULL,
  	"skill_rating" numeric,
  	"skill_years_experience" numeric
  );
  
  CREATE TABLE "profiles_profile_details_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone_number" varchar NOT NULL,
  	"company" varchar,
  	"position_title" varchar NOT NULL,
  	"relationship" varchar NOT NULL
  );
  
  CREATE TABLE "profiles_profile_details_certifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_profiles_profile_details_certifications_type" NOT NULL,
  	"title" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"valid_date" timestamp(3) with time zone,
  	"no_expiry" boolean DEFAULT false,
  	"code" varchar,
  	"issuer" varchar NOT NULL,
  	"supplier" varchar,
  	"description" varchar,
  	"link" varchar
  );
  
  CREATE TABLE "profiles_profile_details_employers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"employer" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"ongoing" boolean,
  	"end_date" timestamp(3) with time zone,
  	"description" varchar NOT NULL,
  	"link" varchar,
  	"achievements" varchar
  );
  
  CREATE TABLE "profiles_profile_details_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"school" varchar NOT NULL,
  	"program" varchar NOT NULL,
  	"level" varchar NOT NULL,
  	"place" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone,
  	"ongoing" boolean,
  	"description" varchar NOT NULL,
  	"link" varchar
  );
  
  CREATE TABLE "profiles_profile_details_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" varchar NOT NULL,
  	"level" varchar NOT NULL
  );
  
  CREATE TABLE "profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"language" "enum_profiles_language" DEFAULT 'en' NOT NULL,
  	"personal_information_id" integer NOT NULL,
  	"availability_information_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "personal_information" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"private_email" varchar,
  	"work_email" varchar,
  	"recovery_email" varchar,
  	"private_email_verified" boolean DEFAULT false,
  	"private_email_verification_token" varchar,
  	"recovery_email_verified" boolean DEFAULT false,
  	"recovery_email_verification_token" varchar,
  	"verification_emails_sent_at" timestamp(3) with time zone,
  	"profile_reminder_sent" boolean DEFAULT false,
  	"profile_reminder_sent_at" timestamp(3) with time zone,
  	"home_address" varchar,
  	"phone_number" varchar,
  	"work_phone_number" varchar,
  	"date_of_birth" timestamp(3) with time zone,
  	"gender" "enum_personal_information_gender",
  	"company_type" varchar,
  	"title" varchar,
  	"professional_presentation" varchar,
  	"personal_presentation" varchar,
  	"profile_image_upload_image_id" integer,
  	"profile_image_static_image" varchar,
  	"social_links_linked_in" varchar,
  	"social_links_x" varchar,
  	"social_links_git_hub" varchar,
  	"social_links_website" varchar,
  	"notification_preferences_email_notifications" boolean DEFAULT false,
  	"notification_preferences_push_notifications" boolean DEFAULT false,
  	"notification_preferences_sms_notifications" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "availability_date_status" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_availability_date_status_status" NOT NULL
  );
  
  CREATE TABLE "availability" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "employment_details" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"employment_rate" "enum_employment_details_employment_rate" NOT NULL,
  	"can_travel" "enum_employment_details_can_travel" NOT NULL,
  	"office_location" varchar NOT NULL,
  	"employment_date" timestamp(3) with time zone NOT NULL,
  	"home_address" varchar NOT NULL,
  	"present_title" varchar NOT NULL,
  	"work_area" varchar NOT NULL,
  	"preferred_location" varchar,
  	"secondary_location" varchar,
  	"assignment_abroad" "enum_employment_details_assignment_abroad" NOT NULL,
  	"salary_level" varchar NOT NULL,
  	"salary_currency" "enum_employment_details_salary_currency" NOT NULL,
  	"fee_rate" varchar NOT NULL,
  	"fee_currency" "enum_employment_details_fee_currency" NOT NULL,
  	"fee_rate_type" "enum_employment_details_fee_rate_type" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cvs_experience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"employer" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"ongoing" boolean DEFAULT false,
  	"description" varchar,
  	"link" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "cvs_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"skill_name" varchar NOT NULL,
  	"skill_rating" numeric,
  	"skill_years_experience" numeric,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "cvs_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"school" varchar NOT NULL,
  	"program" varchar NOT NULL,
  	"level" varchar,
  	"place" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"ongoing" boolean DEFAULT false,
  	"description" varchar,
  	"link" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "cvs_projects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar NOT NULL,
  	"company" varchar,
  	"location" varchar,
  	"project_url" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"is_current" boolean DEFAULT false,
  	"description" varchar,
  	"skills" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "cvs_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" varchar NOT NULL,
  	"level" "enum_cvs_languages_level",
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "cvs_certifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_cvs_certifications_type",
  	"title" varchar NOT NULL,
  	"issuer" varchar,
  	"supplier" varchar,
  	"start_date" timestamp(3) with time zone,
  	"valid_date" timestamp(3) with time zone,
  	"code" varchar,
  	"description" varchar,
  	"link" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "cvs_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar,
  	"phone_number" varchar,
  	"company" varchar,
  	"position_title" varchar,
  	"relationship" varchar,
  	"visible" boolean DEFAULT true
  );
  
  CREATE TABLE "cvs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"is_public" boolean DEFAULT false,
  	"url" varchar,
  	"name" varchar NOT NULL,
  	"personal_info_first_name" varchar NOT NULL,
  	"personal_info_last_name" varchar NOT NULL,
  	"personal_info_home_address" varchar,
  	"personal_info_phone_number" varchar,
  	"personal_info_work_phone_number" varchar,
  	"personal_info_private_email" varchar,
  	"personal_info_work_email" varchar,
  	"personal_info_recovery_email" varchar,
  	"personal_info_date_of_birth" timestamp(3) with time zone,
  	"personal_info_gender" "enum_cvs_personal_info_gender",
  	"personal_info_title" varchar,
  	"personal_info_professional_presentation" varchar,
  	"personal_info_personal_presentation" varchar,
  	"personal_info_company_type" varchar,
  	"personal_info_profile_image_id" integer,
  	"personal_info_company_logo_upload_image_id" integer,
  	"personal_info_company_logo_static_image" varchar,
  	"template" "enum_cvs_template" DEFAULT 'modern',
  	"visibility" jsonb,
  	"portfolio_items" jsonb,
  	"accent_color" varchar,
  	"heading_font_id" varchar,
  	"body_font_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cover_letters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"cv_id" integer,
  	"content" varchar NOT NULL,
  	"job_title" varchar NOT NULL,
  	"company_name" varchar,
  	"job_description" varchar,
  	"tone" "enum_cover_letters_tone" DEFAULT 'professional',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "portfolio_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL
  );
  
  CREATE TABLE "portfolio" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"type" "enum_portfolio_type" NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"featured" boolean DEFAULT false,
  	"image_id" integer,
  	"video_id" integer,
  	"video_thumbnail_id" integer,
  	"youtube_url" varchar,
  	"youtube_video_id" varchar,
  	"link_url" varchar,
  	"link_thumbnail_id" integer,
  	"document_id" integer,
  	"document_name" varchar,
  	"document_size" numeric,
  	"document_ext" "enum_portfolio_document_ext",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"description" varchar,
  	"prefix" varchar DEFAULT 'media',
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
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"roles" "enum_users_roles" DEFAULT 'client' NOT NULL,
  	"auth_type" "enum_users_auth_type" DEFAULT 'credentials' NOT NULL,
  	"has_password" boolean DEFAULT true,
  	"onboarding_completed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "menus" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menus_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_items_id" integer
  );
  
  CREATE TABLE "menu_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_items_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_items_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"job_ads_id" integer,
  	"job_applications_id" integer,
  	"profiles_id" integer,
  	"personal_information_id" integer,
  	"availability_id" integer,
  	"employment_details_id" integer,
  	"cvs_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"menus_id" integer,
  	"menu_items_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_id_job_ads_id_fk" FOREIGN KEY ("job_id_id") REFERENCES "public"."job_ads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_cv_id_media_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_cover_letter_id_media_id_fk" FOREIGN KEY ("cover_letter_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profiles_profile_details_project_details" ADD CONSTRAINT "profiles_profile_details_project_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_profile_details_skills" ADD CONSTRAINT "profiles_profile_details_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_profile_details_references" ADD CONSTRAINT "profiles_profile_details_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_profile_details_certifications" ADD CONSTRAINT "profiles_profile_details_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_profile_details_employers" ADD CONSTRAINT "profiles_profile_details_employers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_profile_details_education" ADD CONSTRAINT "profiles_profile_details_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles_profile_details_languages" ADD CONSTRAINT "profiles_profile_details_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_personal_information_id_personal_information_id_fk" FOREIGN KEY ("personal_information_id") REFERENCES "public"."personal_information"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profiles" ADD CONSTRAINT "profiles_availability_information_id_availability_id_fk" FOREIGN KEY ("availability_information_id") REFERENCES "public"."availability"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "personal_information" ADD CONSTRAINT "personal_information_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "personal_information" ADD CONSTRAINT "personal_information_profile_image_upload_image_id_media_id_fk" FOREIGN KEY ("profile_image_upload_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "availability_date_status" ADD CONSTRAINT "availability_date_status_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."availability"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "availability" ADD CONSTRAINT "availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "employment_details" ADD CONSTRAINT "employment_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvs_experience" ADD CONSTRAINT "cvs_experience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvs_skills" ADD CONSTRAINT "cvs_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvs_education" ADD CONSTRAINT "cvs_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvs_projects" ADD CONSTRAINT "cvs_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvs_languages" ADD CONSTRAINT "cvs_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvs_certifications" ADD CONSTRAINT "cvs_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvs_references" ADD CONSTRAINT "cvs_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvs" ADD CONSTRAINT "cvs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvs" ADD CONSTRAINT "cvs_personal_info_profile_image_id_media_id_fk" FOREIGN KEY ("personal_info_profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvs" ADD CONSTRAINT "cvs_personal_info_company_logo_upload_image_id_media_id_fk" FOREIGN KEY ("personal_info_company_logo_upload_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_cv_id_cvs_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cvs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portfolio_tags" ADD CONSTRAINT "portfolio_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_video_thumbnail_id_media_id_fk" FOREIGN KEY ("video_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_link_thumbnail_id_media_id_fk" FOREIGN KEY ("link_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_document_id_media_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menus_rels" ADD CONSTRAINT "menus_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items_rels" ADD CONSTRAINT "menu_items_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items_rels" ADD CONSTRAINT "menu_items_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_ads_fk" FOREIGN KEY ("job_ads_id") REFERENCES "public"."job_ads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_job_applications_fk" FOREIGN KEY ("job_applications_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profiles_fk" FOREIGN KEY ("profiles_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_personal_information_fk" FOREIGN KEY ("personal_information_id") REFERENCES "public"."personal_information"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_availability_fk" FOREIGN KEY ("availability_id") REFERENCES "public"."availability"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_employment_details_fk" FOREIGN KEY ("employment_details_id") REFERENCES "public"."employment_details"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cvs_fk" FOREIGN KEY ("cvs_id") REFERENCES "public"."cvs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menus_fk" FOREIGN KEY ("menus_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "job_ads_updated_at_idx" ON "job_ads" USING btree ("updated_at");
  CREATE INDEX "job_ads_created_at_idx" ON "job_ads" USING btree ("created_at");
  CREATE INDEX "job_applications_job_id_idx" ON "job_applications" USING btree ("job_id_id");
  CREATE INDEX "job_applications_cv_idx" ON "job_applications" USING btree ("cv_id");
  CREATE INDEX "job_applications_cover_letter_idx" ON "job_applications" USING btree ("cover_letter_id");
  CREATE INDEX "job_applications_updated_at_idx" ON "job_applications" USING btree ("updated_at");
  CREATE INDEX "job_applications_created_at_idx" ON "job_applications" USING btree ("created_at");
  CREATE INDEX "profiles_profile_details_project_details_order_idx" ON "profiles_profile_details_project_details" USING btree ("_order");
  CREATE INDEX "profiles_profile_details_project_details_parent_id_idx" ON "profiles_profile_details_project_details" USING btree ("_parent_id");
  CREATE INDEX "profiles_profile_details_skills_order_idx" ON "profiles_profile_details_skills" USING btree ("_order");
  CREATE INDEX "profiles_profile_details_skills_parent_id_idx" ON "profiles_profile_details_skills" USING btree ("_parent_id");
  CREATE INDEX "profiles_profile_details_references_order_idx" ON "profiles_profile_details_references" USING btree ("_order");
  CREATE INDEX "profiles_profile_details_references_parent_id_idx" ON "profiles_profile_details_references" USING btree ("_parent_id");
  CREATE INDEX "profiles_profile_details_certifications_order_idx" ON "profiles_profile_details_certifications" USING btree ("_order");
  CREATE INDEX "profiles_profile_details_certifications_parent_id_idx" ON "profiles_profile_details_certifications" USING btree ("_parent_id");
  CREATE INDEX "profiles_profile_details_employers_order_idx" ON "profiles_profile_details_employers" USING btree ("_order");
  CREATE INDEX "profiles_profile_details_employers_parent_id_idx" ON "profiles_profile_details_employers" USING btree ("_parent_id");
  CREATE INDEX "profiles_profile_details_education_order_idx" ON "profiles_profile_details_education" USING btree ("_order");
  CREATE INDEX "profiles_profile_details_education_parent_id_idx" ON "profiles_profile_details_education" USING btree ("_parent_id");
  CREATE INDEX "profiles_profile_details_languages_order_idx" ON "profiles_profile_details_languages" USING btree ("_order");
  CREATE INDEX "profiles_profile_details_languages_parent_id_idx" ON "profiles_profile_details_languages" USING btree ("_parent_id");
  CREATE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");
  CREATE INDEX "profiles_personal_information_idx" ON "profiles" USING btree ("personal_information_id");
  CREATE INDEX "profiles_availability_information_idx" ON "profiles" USING btree ("availability_information_id");
  CREATE INDEX "profiles_updated_at_idx" ON "profiles" USING btree ("updated_at");
  CREATE INDEX "profiles_created_at_idx" ON "profiles" USING btree ("created_at");
  CREATE INDEX "personal_information_user_idx" ON "personal_information" USING btree ("user_id");
  CREATE UNIQUE INDEX "personal_information_recovery_email_idx" ON "personal_information" USING btree ("recovery_email");
  CREATE INDEX "personal_information_profile_image_profile_image_upload__idx" ON "personal_information" USING btree ("profile_image_upload_image_id");
  CREATE INDEX "personal_information_updated_at_idx" ON "personal_information" USING btree ("updated_at");
  CREATE INDEX "personal_information_created_at_idx" ON "personal_information" USING btree ("created_at");
  CREATE INDEX "availability_date_status_order_idx" ON "availability_date_status" USING btree ("_order");
  CREATE INDEX "availability_date_status_parent_id_idx" ON "availability_date_status" USING btree ("_parent_id");
  CREATE INDEX "availability_user_idx" ON "availability" USING btree ("user_id");
  CREATE INDEX "availability_updated_at_idx" ON "availability" USING btree ("updated_at");
  CREATE INDEX "availability_created_at_idx" ON "availability" USING btree ("created_at");
  CREATE UNIQUE INDEX "employment_details_user_idx" ON "employment_details" USING btree ("user_id");
  CREATE INDEX "employment_details_updated_at_idx" ON "employment_details" USING btree ("updated_at");
  CREATE INDEX "employment_details_created_at_idx" ON "employment_details" USING btree ("created_at");
  CREATE INDEX "cvs_experience_order_idx" ON "cvs_experience" USING btree ("_order");
  CREATE INDEX "cvs_experience_parent_id_idx" ON "cvs_experience" USING btree ("_parent_id");
  CREATE INDEX "cvs_skills_order_idx" ON "cvs_skills" USING btree ("_order");
  CREATE INDEX "cvs_skills_parent_id_idx" ON "cvs_skills" USING btree ("_parent_id");
  CREATE INDEX "cvs_education_order_idx" ON "cvs_education" USING btree ("_order");
  CREATE INDEX "cvs_education_parent_id_idx" ON "cvs_education" USING btree ("_parent_id");
  CREATE INDEX "cvs_projects_order_idx" ON "cvs_projects" USING btree ("_order");
  CREATE INDEX "cvs_projects_parent_id_idx" ON "cvs_projects" USING btree ("_parent_id");
  CREATE INDEX "cvs_languages_order_idx" ON "cvs_languages" USING btree ("_order");
  CREATE INDEX "cvs_languages_parent_id_idx" ON "cvs_languages" USING btree ("_parent_id");
  CREATE INDEX "cvs_certifications_order_idx" ON "cvs_certifications" USING btree ("_order");
  CREATE INDEX "cvs_certifications_parent_id_idx" ON "cvs_certifications" USING btree ("_parent_id");
  CREATE INDEX "cvs_references_order_idx" ON "cvs_references" USING btree ("_order");
  CREATE INDEX "cvs_references_parent_id_idx" ON "cvs_references" USING btree ("_parent_id");
  CREATE INDEX "cvs_user_idx" ON "cvs" USING btree ("user_id");
  CREATE INDEX "cvs_personal_info_personal_info_profile_image_idx" ON "cvs" USING btree ("personal_info_profile_image_id");
  CREATE INDEX "cvs_personal_info_company_logo_personal_info_company_log_idx" ON "cvs" USING btree ("personal_info_company_logo_upload_image_id");
  CREATE INDEX "cvs_updated_at_idx" ON "cvs" USING btree ("updated_at");
  CREATE INDEX "cvs_created_at_idx" ON "cvs" USING btree ("created_at");
  CREATE INDEX "cover_letters_user_idx" ON "cover_letters" USING btree ("user_id");
  CREATE INDEX "cover_letters_cv_idx" ON "cover_letters" USING btree ("cv_id");
  CREATE INDEX "cover_letters_updated_at_idx" ON "cover_letters" USING btree ("updated_at");
  CREATE INDEX "cover_letters_created_at_idx" ON "cover_letters" USING btree ("created_at");
  CREATE INDEX "portfolio_tags_order_idx" ON "portfolio_tags" USING btree ("_order");
  CREATE INDEX "portfolio_tags_parent_id_idx" ON "portfolio_tags" USING btree ("_parent_id");
  CREATE INDEX "portfolio_user_idx" ON "portfolio" USING btree ("user_id");
  CREATE INDEX "portfolio_image_idx" ON "portfolio" USING btree ("image_id");
  CREATE INDEX "portfolio_video_idx" ON "portfolio" USING btree ("video_id");
  CREATE INDEX "portfolio_video_thumbnail_idx" ON "portfolio" USING btree ("video_thumbnail_id");
  CREATE INDEX "portfolio_link_thumbnail_idx" ON "portfolio" USING btree ("link_thumbnail_id");
  CREATE INDEX "portfolio_document_idx" ON "portfolio" USING btree ("document_id");
  CREATE INDEX "portfolio_updated_at_idx" ON "portfolio" USING btree ("updated_at");
  CREATE INDEX "portfolio_created_at_idx" ON "portfolio" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "menus_slug_idx" ON "menus" USING btree ("slug");
  CREATE INDEX "menus_updated_at_idx" ON "menus" USING btree ("updated_at");
  CREATE INDEX "menus_created_at_idx" ON "menus" USING btree ("created_at");
  CREATE INDEX "menus_rels_order_idx" ON "menus_rels" USING btree ("order");
  CREATE INDEX "menus_rels_parent_idx" ON "menus_rels" USING btree ("parent_id");
  CREATE INDEX "menus_rels_path_idx" ON "menus_rels" USING btree ("path");
  CREATE INDEX "menus_rels_menu_items_id_idx" ON "menus_rels" USING btree ("menu_items_id");
  CREATE INDEX "menu_items_updated_at_idx" ON "menu_items" USING btree ("updated_at");
  CREATE INDEX "menu_items_created_at_idx" ON "menu_items" USING btree ("created_at");
  CREATE INDEX "menu_items_rels_order_idx" ON "menu_items_rels" USING btree ("order");
  CREATE INDEX "menu_items_rels_parent_idx" ON "menu_items_rels" USING btree ("parent_id");
  CREATE INDEX "menu_items_rels_path_idx" ON "menu_items_rels" USING btree ("path");
  CREATE INDEX "menu_items_rels_menu_items_id_idx" ON "menu_items_rels" USING btree ("menu_items_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_job_ads_id_idx" ON "payload_locked_documents_rels" USING btree ("job_ads_id");
  CREATE INDEX "payload_locked_documents_rels_job_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("job_applications_id");
  CREATE INDEX "payload_locked_documents_rels_profiles_id_idx" ON "payload_locked_documents_rels" USING btree ("profiles_id");
  CREATE INDEX "payload_locked_documents_rels_personal_information_id_idx" ON "payload_locked_documents_rels" USING btree ("personal_information_id");
  CREATE INDEX "payload_locked_documents_rels_availability_id_idx" ON "payload_locked_documents_rels" USING btree ("availability_id");
  CREATE INDEX "payload_locked_documents_rels_employment_details_id_idx" ON "payload_locked_documents_rels" USING btree ("employment_details_id");
  CREATE INDEX "payload_locked_documents_rels_cvs_id_idx" ON "payload_locked_documents_rels" USING btree ("cvs_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_menus_id_idx" ON "payload_locked_documents_rels" USING btree ("menus_id");
  CREATE INDEX "payload_locked_documents_rels_menu_items_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_items_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "job_ads" CASCADE;
  DROP TABLE "job_applications" CASCADE;
  DROP TABLE "profiles_profile_details_project_details" CASCADE;
  DROP TABLE "profiles_profile_details_skills" CASCADE;
  DROP TABLE "profiles_profile_details_references" CASCADE;
  DROP TABLE "profiles_profile_details_certifications" CASCADE;
  DROP TABLE "profiles_profile_details_employers" CASCADE;
  DROP TABLE "profiles_profile_details_education" CASCADE;
  DROP TABLE "profiles_profile_details_languages" CASCADE;
  DROP TABLE "profiles" CASCADE;
  DROP TABLE "personal_information" CASCADE;
  DROP TABLE "availability_date_status" CASCADE;
  DROP TABLE "availability" CASCADE;
  DROP TABLE "employment_details" CASCADE;
  DROP TABLE "cvs_experience" CASCADE;
  DROP TABLE "cvs_skills" CASCADE;
  DROP TABLE "cvs_education" CASCADE;
  DROP TABLE "cvs_projects" CASCADE;
  DROP TABLE "cvs_languages" CASCADE;
  DROP TABLE "cvs_certifications" CASCADE;
  DROP TABLE "cvs_references" CASCADE;
  DROP TABLE "cvs" CASCADE;
  DROP TABLE "cover_letters" CASCADE;
  DROP TABLE "portfolio_tags" CASCADE;
  DROP TABLE "portfolio" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "menus" CASCADE;
  DROP TABLE "menus_rels" CASCADE;
  DROP TABLE "menu_items" CASCADE;
  DROP TABLE "menu_items_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_job_applications_employment_type";
  DROP TYPE "public"."enum_job_applications_desired_employment_percentage";
  DROP TYPE "public"."enum_profiles_profile_details_certifications_type";
  DROP TYPE "public"."enum_profiles_language";
  DROP TYPE "public"."enum_personal_information_gender";
  DROP TYPE "public"."enum_availability_date_status_status";
  DROP TYPE "public"."enum_employment_details_employment_rate";
  DROP TYPE "public"."enum_employment_details_can_travel";
  DROP TYPE "public"."enum_employment_details_assignment_abroad";
  DROP TYPE "public"."enum_employment_details_salary_currency";
  DROP TYPE "public"."enum_employment_details_fee_currency";
  DROP TYPE "public"."enum_employment_details_fee_rate_type";
  DROP TYPE "public"."enum_cvs_languages_level";
  DROP TYPE "public"."enum_cvs_certifications_type";
  DROP TYPE "public"."enum_cvs_personal_info_gender";
  DROP TYPE "public"."enum_cvs_template";
  DROP TYPE "public"."enum_cover_letters_tone";
  DROP TYPE "public"."enum_portfolio_type";
  DROP TYPE "public"."enum_portfolio_document_ext";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_auth_type";`)
}

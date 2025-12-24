


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."persons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "photo_url" "text",
    "phone" "text",
    "email" "text",
    "linkedin" "text",
    "birthday" "date",
    "family_members" "jsonb",
    "where_met" "text",
    "who_introduced" "text",
    "when_met" "text",
    "why_stay_in_contact" "text",
    "what_found_interesting" "text",
    "most_important_to_them" "text",
    "interests" "text"[],
    "family_notes" "text",
    "notes" "text",
    "last_contact" timestamp with time zone,
    "follow_up_reminder" timestamp with time zone,
    "archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_reason" "text",
    "first_impression" "text",
    "memorable_moment" "text",
    "relationship_value" "text",
    "what_i_offered" "text",
    "what_they_offered" "text",
    "story_completeness" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "relationship_summary" "text",
    "last_interaction_date" timestamp with time zone,
    "interaction_count" integer DEFAULT 0,
    "contact_importance" "text",
    "archive_status" boolean DEFAULT false,
    "is_favorite" boolean DEFAULT false,
    "has_context" boolean DEFAULT false,
    "imported" boolean DEFAULT false,
    "importance" "text" DEFAULT 'medium'::"text",
    "important_dates" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "persons_contact_importance_check" CHECK (("contact_importance" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "persons_importance_check" CHECK (("importance" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."persons" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_decaying_relationships"("p_user_id" "uuid", "days_threshold" integer) RETURNS SETOF "public"."persons"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM persons
  WHERE user_id = p_user_id
    AND (archived IS FALSE OR archived IS NULL)
    AND (
      last_interaction_date < (NOW() - (days_threshold || ' days')::INTERVAL)
      OR 
      (last_interaction_date IS NULL AND created_at < (NOW() - (days_threshold || ' days')::INTERVAL))
    )
  ORDER BY last_interaction_date ASC NULLS FIRST
  LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."get_decaying_relationships"("p_user_id" "uuid", "days_threshold" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."merge_contacts"("keeper_id" "uuid", "duplicate_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    dup_person persons%ROWTYPE;
BEGIN
    -- get duplicate person data
    SELECT * INTO dup_person FROM persons WHERE id = duplicate_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Duplicate contact not found';
    END IF;

    -- 1. Move Interactions
    UPDATE interactions 
    SET person_id = keeper_id 
    WHERE person_id = duplicate_id;

    -- 2. Move Meetings - REMOVED (Table does not exist, covered by interactions)
    -- UPDATE meetings SET contact_id = keeper_id WHERE contact_id = duplicate_id;

    -- 3. Move Contact Facts
    UPDATE contact_facts 
    SET contact_id = keeper_id 
    WHERE contact_id = duplicate_id;

    -- 4. Move Relationships (As A or B)
    -- Relationships where duplicate is A
    UPDATE inter_contact_relationships
    SET contact_id_a = keeper_id
    WHERE contact_id_a = duplicate_id
    AND NOT EXISTS (
        SELECT 1 FROM inter_contact_relationships existing
        WHERE existing.contact_id_a = keeper_id
        AND existing.contact_id_b = inter_contact_relationships.contact_id_b
    );
    -- Delete remaining (conflicts)
    DELETE FROM inter_contact_relationships WHERE contact_id_a = duplicate_id;

    -- Relationships where duplicate is B
    UPDATE inter_contact_relationships
    SET contact_id_b = keeper_id
    WHERE contact_id_b = duplicate_id
    AND NOT EXISTS (
        SELECT 1 FROM inter_contact_relationships existing
        WHERE existing.contact_id_b = keeper_id
        AND existing.contact_id_a = inter_contact_relationships.contact_id_a
    );
    -- Delete remaining (conflicts)
    DELETE FROM inter_contact_relationships WHERE contact_id_b = duplicate_id;

    -- 5. Move Interests
    -- Insert interests from duplicate that keeper doesn't have
    INSERT INTO person_interests (person_id, interest_id)
    SELECT keeper_id, interest_id
    FROM person_interests
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;
    
    -- Delete duplicate's interests
    DELETE FROM person_interests WHERE person_id = duplicate_id;

    -- 5b. Move Tags (New Step)
    -- Insert tags from duplicate that keeper doesn't have
    INSERT INTO person_tags (person_id, tag_id)
    SELECT keeper_id, tag_id
    FROM person_tags
    WHERE person_id = duplicate_id
    ON CONFLICT DO NOTHING;

    -- Delete duplicate's tags
    DELETE FROM person_tags WHERE person_id = duplicate_id;

    -- 6. Update Keeper Fields (Fill in missing info)
    UPDATE persons
    SET
        email = COALESCE(persons.email, dup_person.email),
        phone = COALESCE(persons.phone, dup_person.phone),
        photo_url = COALESCE(persons.photo_url, dup_person.photo_url),
        notes = COALESCE(persons.notes, '') || E'\n\n[Merged Notes]:\n' || COALESCE(dup_person.notes, ''),
        where_met = COALESCE(persons.where_met, dup_person.where_met),
        last_contact = GREATEST(persons.last_contact, dup_person.last_contact),
        interaction_count = persons.interaction_count + dup_person.interaction_count
    WHERE id = keeper_id;

    -- 7. Delete Duplicate
    DELETE FROM persons WHERE id = duplicate_id;

END;
$$;


ALTER FUNCTION "public"."merge_contacts"("keeper_id" "uuid", "duplicate_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_facts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid",
    "category" "text" DEFAULT 'general'::"text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contact_facts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inter_contact_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "contact_id_a" "uuid",
    "contact_id_b" "uuid",
    "relationship_type" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inter_contact_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "person_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interactions_type_check" CHECK (("type" = ANY (ARRAY['call'::"text", 'text'::"text", 'email'::"text", 'in-person'::"text", 'social'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "domain_id" "uuid"
);


ALTER TABLE "public"."interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."person_interests" (
    "person_id" "uuid" NOT NULL,
    "interest_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."person_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."person_tags" (
    "person_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."person_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tag_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "domain_id" "uuid"
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "contacts_with_context" integer DEFAULT 0,
    "total_contacts" integer DEFAULT 0,
    "voice_memos_added" integer DEFAULT 0,
    "last_activity_date" timestamp with time zone,
    "streak_days" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_stats" OWNER TO "postgres";


ALTER TABLE ONLY "public"."contact_facts"
    ADD CONSTRAINT "contact_facts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inter_contact_relationships"
    ADD CONSTRAINT "inter_contact_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."person_interests"
    ADD CONSTRAINT "person_interests_pkey" PRIMARY KEY ("person_id", "interest_id");



ALTER TABLE ONLY "public"."person_tags"
    ADD CONSTRAINT "person_tags_pkey" PRIMARY KEY ("person_id", "tag_id");



ALTER TABLE ONLY "public"."persons"
    ADD CONSTRAINT "persons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tag_domains"
    ADD CONSTRAINT "tag_domains_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tag_domains"
    ADD CONSTRAINT "tag_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inter_contact_relationships"
    ADD CONSTRAINT "unique_relationship" UNIQUE ("contact_id_a", "contact_id_b");



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_contact_facts_contact_id" ON "public"."contact_facts" USING "btree" ("contact_id");



CREATE INDEX "idx_interactions_date" ON "public"."interactions" USING "btree" ("date" DESC);



CREATE INDEX "idx_interactions_person_id" ON "public"."interactions" USING "btree" ("person_id");



CREATE INDEX "idx_interactions_user_id" ON "public"."interactions" USING "btree" ("user_id");



CREATE INDEX "idx_interests_name" ON "public"."interests" USING "btree" ("name");



CREATE INDEX "idx_person_interests_interest_id" ON "public"."person_interests" USING "btree" ("interest_id");



CREATE INDEX "idx_person_interests_person_id" ON "public"."person_interests" USING "btree" ("person_id");



CREATE INDEX "idx_person_tags_person_id" ON "public"."person_tags" USING "btree" ("person_id");



CREATE INDEX "idx_person_tags_tag_id" ON "public"."person_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_persons_importance" ON "public"."persons" USING "btree" ("importance");



CREATE INDEX "idx_persons_last_interaction" ON "public"."persons" USING "btree" ("user_id", "last_interaction_date");



CREATE INDEX "idx_persons_relationship_summary" ON "public"."persons" USING "btree" ("relationship_summary");



CREATE INDEX "idx_persons_user_name" ON "public"."persons" USING "btree" ("user_id", "name");



CREATE INDEX "idx_relationships_contact_a" ON "public"."inter_contact_relationships" USING "btree" ("contact_id_a");



CREATE INDEX "idx_relationships_contact_b" ON "public"."inter_contact_relationships" USING "btree" ("contact_id_b");



CREATE INDEX "idx_relationships_user_id" ON "public"."inter_contact_relationships" USING "btree" ("user_id");



CREATE INDEX "idx_tags_name" ON "public"."tags" USING "btree" ("name");



ALTER TABLE ONLY "public"."contact_facts"
    ADD CONSTRAINT "contact_facts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."persons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inter_contact_relationships"
    ADD CONSTRAINT "inter_contact_relationships_contact_id_a_fkey" FOREIGN KEY ("contact_id_a") REFERENCES "public"."persons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inter_contact_relationships"
    ADD CONSTRAINT "inter_contact_relationships_contact_id_b_fkey" FOREIGN KEY ("contact_id_b") REFERENCES "public"."persons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inter_contact_relationships"
    ADD CONSTRAINT "inter_contact_relationships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interests"
    ADD CONSTRAINT "interests_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."tag_domains"("id");



ALTER TABLE ONLY "public"."person_interests"
    ADD CONSTRAINT "person_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."person_interests"
    ADD CONSTRAINT "person_interests_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."person_tags"
    ADD CONSTRAINT "person_tags_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."person_tags"
    ADD CONSTRAINT "person_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."persons"
    ADD CONSTRAINT "persons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."tag_domains"("id");



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can create interests" ON "public"."interests" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."tag_domains" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Interests are viewable by authenticated users" ON "public"."interests" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Tags are viewable by authenticated users" ON "public"."tags" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete interests from their contacts" ON "public"."person_interests" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "person_interests"."person_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own contact facts" ON "public"."contact_facts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "contact_facts"."contact_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own interactions" ON "public"."interactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own relationships" ON "public"."inter_contact_relationships" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete tags from their contacts" ON "public"."person_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "person_tags"."person_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own persons" ON "public"."persons" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert interests for their contacts" ON "public"."person_interests" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "person_interests"."person_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own contact facts" ON "public"."contact_facts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "contact_facts"."contact_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own interactions" ON "public"."interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own relationships" ON "public"."inter_contact_relationships" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own stats" ON "public"."user_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert tags for their contacts" ON "public"."person_tags" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "person_tags"."person_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own persons" ON "public"."persons" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own contact facts" ON "public"."contact_facts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "contact_facts"."contact_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own interactions" ON "public"."interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own relationships" ON "public"."inter_contact_relationships" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own stats" ON "public"."user_stats" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own persons" ON "public"."persons" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own contact facts" ON "public"."contact_facts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "contact_facts"."contact_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own interactions" ON "public"."interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own relationships" ON "public"."inter_contact_relationships" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own stats" ON "public"."user_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their contacts' interests" ON "public"."person_interests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "person_interests"."person_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their contacts' tags" ON "public"."person_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."persons"
  WHERE (("persons"."id" = "person_tags"."person_id") AND ("persons"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own persons" ON "public"."persons" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."contact_facts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inter_contact_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."person_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."person_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."persons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stats" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."persons" TO "anon";
GRANT ALL ON TABLE "public"."persons" TO "authenticated";
GRANT ALL ON TABLE "public"."persons" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_decaying_relationships"("p_user_id" "uuid", "days_threshold" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_decaying_relationships"("p_user_id" "uuid", "days_threshold" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_decaying_relationships"("p_user_id" "uuid", "days_threshold" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."merge_contacts"("keeper_id" "uuid", "duplicate_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."merge_contacts"("keeper_id" "uuid", "duplicate_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."merge_contacts"("keeper_id" "uuid", "duplicate_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."contact_facts" TO "anon";
GRANT ALL ON TABLE "public"."contact_facts" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_facts" TO "service_role";



GRANT ALL ON TABLE "public"."inter_contact_relationships" TO "anon";
GRANT ALL ON TABLE "public"."inter_contact_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."inter_contact_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."interests" TO "anon";
GRANT ALL ON TABLE "public"."interests" TO "authenticated";
GRANT ALL ON TABLE "public"."interests" TO "service_role";



GRANT ALL ON TABLE "public"."person_interests" TO "anon";
GRANT ALL ON TABLE "public"."person_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."person_interests" TO "service_role";



GRANT ALL ON TABLE "public"."person_tags" TO "anon";
GRANT ALL ON TABLE "public"."person_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."person_tags" TO "service_role";



GRANT ALL ON TABLE "public"."tag_domains" TO "anon";
GRANT ALL ON TABLE "public"."tag_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_domains" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








ALTER TABLE "embeddings" RENAME TO "Embeddings";--> statement-breakpoint
ALTER TABLE "resources" RENAME TO "Resources";--> statement-breakpoint
ALTER TABLE "Embeddings" DROP CONSTRAINT "embeddings_resource_id_resources_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Embeddings" ADD CONSTRAINT "Embeddings_resource_id_Resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."Resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

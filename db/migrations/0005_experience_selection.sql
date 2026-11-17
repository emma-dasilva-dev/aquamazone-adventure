-- V1.5G: a single enquiry may include several standalone activities and
-- an optional experience package. No capacity allocation or payment is implied.
BEGIN;
ALTER TABLE reservations
 ADD COLUMN IF NOT EXISTS experience_selection jsonb;
ALTER TABLE reservations
 ADD CONSTRAINT reservation_experience_selection_is_object
 CHECK (experience_selection IS NULL OR jsonb_typeof(experience_selection)='object');
GRANT INSERT(experience_selection) ON reservations TO aquamazone_intake;
COMMIT;

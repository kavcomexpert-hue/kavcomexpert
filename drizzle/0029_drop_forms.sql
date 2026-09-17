-- Remove the Forms builder feature. The public site never used it
-- (contact submissions go to the leads table). Any existing rows were
-- exported to /exports before this migration was applied.
-- IF EXISTS keeps this safe on databases where 0027_forms was never run.

DROP TABLE IF EXISTS form_submissions;
DROP TABLE IF EXISTS forms;

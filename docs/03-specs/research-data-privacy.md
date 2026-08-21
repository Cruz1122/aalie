# Research data privacy contract

MF3 separates operational identity from research identity. Better Auth `user.id` is used only to resolve the server-side `study_identity_links` record. Academic evidence references the pseudonymous `participant_id`.

Login is not consent. Login must not create a participant. Explicit consent to an ACTIVE study creates the participant, identity link, and append-only consent action. Withdrawal appends a withdrawal action, marks the participant withdrawn, and blocks new experimental evidence.

The academic research export may contain participant ID/code, AALIE|CONTROL condition, quiz attempt/question identifiers, question versions and SHA-256 fingerprints, scores, selector/grader/progress versions, allowlisted feature events, durations, measurements, study/version metadata, and file hashes.

The research export must not contain Better Auth user ID, Google ID, email, name, IP address, user-agent, pseudocode/source code, LLM prompt, full LLM response, or textual answer keys/explanations by default.

Study telemetry is allowlisted to `analysis_run`, `trace_run`, `export_run`, and `llm_run`. It is disabled globally by default and is recorded only for an ACTIVE study, a consented/non-withdrawn/non-excluded participant with an assigned condition, a study with telemetry enabled, and a deployment with `AALIE_STUDY_TELEMETRY_ENABLED=true`.

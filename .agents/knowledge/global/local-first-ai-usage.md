# Local-First AI Usage

Media and deterministic extraction are local-first to conserve AI tokens and reduce external disclosure. Voice uses the internal Whisper runtime. OCR, parsing, conversion, metadata, and validation must use an installed local capability before AI is considered.

AI may receive only minimal extracted text for semantic classification, categorization, summarization, or ambiguity resolution. It never bypasses confirmation, authorization, validation, or audit controls.

Raw-media AI is an approved exception only when local processing cannot meet the requirement and the exception records the reason, data minimization, cost impact, and fallback. Dependencies, language models, and runtime-image changes require an approved implementation plan.

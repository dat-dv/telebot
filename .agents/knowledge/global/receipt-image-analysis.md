# Receipt Image Analysis

Telegram photos are transcribed locally with Tesseract `vie+eng` before semantic analysis. Gemini receives only normalized OCR text; it never receives image bytes, base64 image data, or Telegram file URLs. Neither image bytes nor extracted text are persisted or logged.

The model returns one of three states: `ready`, `missing_fields`, or `not_receipt`. Only `ready` with a valid income/expense type, positive VND amount, and note can enqueue `create_finance_transaction`. The existing confirmation action remains mandatory before the finance record is written.

The service has bounded download timeout and byte size. Blurry, unrelated, or incomplete images must prompt for a clearer image or the specific missing field; they must not create a transaction.

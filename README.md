# Shorts MVP Frontend (Next.js + Tailwind)

A minimal React UI to talk to the Shorts MVP FastAPI backend.

## Setup
1) Node 18+
2) Install deps: `npm install`
3) Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE` (default is `http://localhost:8000`).
4) Run dev server: `npm run dev` (http://localhost:3000)

## Flow
- Upload a video (1–3 min).
- Click **Transcribe**.
- Optionally paste your own transcript to replace.
- Choose aspect, fit, style, and trim start/end.
- Click **Export MP4**. The browser will open a download URL **if** the backend exposes exported files.

## Important: expose output files from backend
To download exports from the browser, the backend must serve its `DATA_DIR` as static files.

Add this to `app/main.py` in the FastAPI backend (imports + after FastAPI init):

```python
from fastapi.staticfiles import StaticFiles

# after `app = FastAPI(...)`
app.mount("/files", StaticFiles(directory=DATA_DIR), name="files")
```

Then the frontend will open a URL like: `http://localhost:8000/files/outputs/<video_id>/export_9x16.mp4`.

## Notes
- This UI deliberately keeps client-side logic simple. For real-time caption preview, add an API that returns segments and render them over the `<video>` with a timed text track or canvas.
- CORS must be enabled on the backend (the provided boilerplate already enables `allow_origins=["*"]`).

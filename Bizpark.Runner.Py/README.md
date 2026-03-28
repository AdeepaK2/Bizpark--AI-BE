# Bizpark Runner (FastAPI)

AI agent task processor. Consumes jobs from the same BullMQ Redis queue that NestJS API pushes to.

Uses shared env from `Bizpark.Core/.env` — no separate `.env` needed.

## Setup

```bash
cd Bizpark.Runner.Py

# Create virtual env
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

## Run

```bash
python run.py
```

Runs on `http://localhost:3001`

## Project Structure

```
Bizpark.Runner.Py/
├── run.py                  # Entry point
├── requirements.txt        # Python dependencies
└── app/
    ├── main.py             # FastAPI app + BullMQ worker startup
    ├── config.py           # Loads settings from Bizpark.Core/.env
    ├── db/
    │   ├── models.py       # SQLAlchemy models (AgentTask)
    │   └── session.py      # Async DB session (Neon/PostgreSQL)
    ├── worker/
    │   └── processor.py    # BullMQ worker + task processor
    └── agents/
        ├── base.py         # BaseAgent ABC
        ├── template_selector.py
        ├── content_strategy.py
        └── copywriter.py
```

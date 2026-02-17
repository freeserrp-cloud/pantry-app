# Pantry App

A clean, mobile-first pantry management app for a single household, with a FastAPI backend and Angular frontend.

## Project Structure

```
/pantry-app
  /frontend
  /backend
  docker-compose.yml
  README.md
```

## Backend (FastAPI)

### Run locally

```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Endpoints

- `GET /health`
- `GET /items`
- `POST /items`
- `PUT /items/{id}`
- `DELETE /items/{id}`
- `POST /items/{id}/increment`
- `POST /items/{id}/decrement`

### Database

By default the app uses SQLite (`pantry.db`). To switch to Postgres later, set `DATABASE_URL`:

```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/pantry
```

## Frontend (Angular)

### Run locally

```
cd frontend
npm install
npm run start
```

The app runs at `http://localhost:4200` and expects the API at `http://localhost:8000`.

### PWA

The project includes service worker configuration and a basic manifest. Replace the placeholder icons in:

- `frontend/src/assets/icons/icon-192.png`
- `frontend/src/assets/icons/icon-512.png`

## Docker (Backend)

```
cd pantry-app
docker compose up --build
```

The backend will be available at `http://localhost:8000`.

## Notes

- The backend includes `household_id` for future multi-household support; currently it defaults to a single household.
- CORS is enabled for local development to allow the Angular app to communicate with the API.

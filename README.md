# Setup
- install backend dependancies `cd backend && pipenv install`
- install frontend depdancies `cd frontend && npm install`

# Run
## With Docker
- build: `docker-compose build`
- run: `docker-compose up`
- open browser to `http://localhost:3000`

## Without Docker
- start backend server `cd backend && pipenv run server`
- start frontend `cd frontend && npm start`

Backend runs on port 8000\
Frontend runs on port 3000\
Docs at `http://127.0.0.1:8000/docs`
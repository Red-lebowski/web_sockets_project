# Use the official image as a parent image.
FROM python:3.8

# Set the working directory.
WORKDIR /usr/src/backend

RUN pip install --no-cache-dir pipenv

COPY Pipfile .
COPY Pipfile.lock .
COPY . . 

RUN pipenv install --dev

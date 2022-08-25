FROM python:3.10-slim-buster

WORKDIR /app

RUN pip3 install torch torchvision torchaudio
COPY requirements.txt requirements.txt


COPY . .

ENV FLASK_APP=/home/filou/LDM-canvas/api/imagen_api/server_imagen.py

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
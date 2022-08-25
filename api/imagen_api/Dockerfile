FROM python:3.10-slim-buster

WORKDIR /app
COPY requirements.txt requirements.txt

RUN pip3 install torch torchvision torchaudio
RUN pip3 install -r requirements.txt

COPY . .

ENV FLASK_APP=/home/filou/LDM-canvas/api/imagen_api/server_imagen.py

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
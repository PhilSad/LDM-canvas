FROM nvidia/cuda:11.0.3-base-ubuntu20.04 

WORKDIR /app
COPY requirements.txt requirements.txt
RUN apt update
RUN apt -y install python3 python3-pip
RUN yes | pip3 install torch torchvision torchaudio
RUN yes | pip3 install -r requirements.txt

COPY . .

ENV FLASK_APP=/home/filou/LDM-canvas/api/imagen_api/server_imagen.py

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]

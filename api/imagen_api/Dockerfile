FROM nvidia/cuda

WORKDIR /app

COPY requirements.txt requirements.txt

RUN apt update
RUN apt install python3 python3-venv python3-pip
RUN python3 -m venv env
RUN source ./env/bin/activate
RUN pip3 install -r requirements.txt

COPY . .

ENV FLASK_APP=/home/filou/LDM-canvas/api/imagen_api/server_imagen.py

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
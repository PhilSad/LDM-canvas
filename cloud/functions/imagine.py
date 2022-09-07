import urllib.request
from google.cloud import storage
import io
from flask import request
from PIL import Image
import functions_framework
from sqlalchemy import insert
import os
import requests
import sqlalchemy as db
from PIL import Image
from io import BytesIO
import base64
import datetime
import time

def connect_unix_socket() -> db.engine.base.Engine:
    db_user = os.environ["DB_USER"]  # e.g. 'my-database-user'
    db_pass = os.environ["DB_PASS"]  # e.g. 'my-database-password'
    db_name = os.environ["DB_NAME"]  # e.g. 'my-database'
    unix_socket_path = os.environ["INSTANCE_UNIX_SOCKET"]  # e.g. '/cloudsql/project:region:instance'

    pool = db.create_engine(
        db.engine.url.URL.create(
            drivername="mysql+pymysql",
            username=db_user,
            password=db_pass,
            database=db_name,
            query={"unix_socket": unix_socket_path},
        ))
    return pool



headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '0'
}

def save_image_to_(blob):
    contenido = blob.download_as_string()
    fp = io.BytesIO(contenido)
    generated = Image.open(fp)
    return generated

@functions_framework.http
def imagine(request):
    engine = connect_unix_socket()
    connection = engine.connect()
    metadata = db.MetaData()
    images = db.Table('images', metadata, autoload=True, autoload_with=engine)

    storage_client = storage.Client()
    bucket = storage_client.bucket('aicanvas-public-bucket')
    
    URL_IMAGEN_SERVER = 'https://gpu.apipicaisso.ml/imagine/'

    prompt = request.args.get('prompt')
    posX = int(request.args.get('posX'))
    posY = int(request.args.get('posY'))
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))
    
    url_with_params = f'{URL_IMAGEN_SERVER}?prompt={prompt}&posX={posX}&posY={posY}&width={width}&height={height}' 
    print(url_with_params)
    
    #call gpu and get image
    image_b64 = requests.get(url_with_params).text

    # load image
    generated_image = Image.open(BytesIO(base64.b64decode(image_b64)))

    # prepare path
    ts = str(datetime.datetime.now().strftime("%Y%m%d%H%M%S%f"))
    decoded_prompt = base64.b64decode(prompt)
    path = f'default/{ts}-{decoded_prompt}.png'


    # save image to db
    data_to_add = dict(
        path=path,
        posX=posX,
        posY=posY,
        width = width,
        height = height
    )
    query = db.insert(images).values(**data_to_add)
    engine.execute(query)

    # save image to bucket
    save_path_tmp = f'{os.tmpdir()}/{ts}.png'
    print(save_path_tmp)
    generated_image.save(save_path_tmp, quality=100)
    blob_path_save_image = bucket.blob(path)
    blob_path_save_image.upload_from_filename(f'{ts}.png')


    return ('ok', 201, headers)

from concurrent.futures import TimeoutError
from google.cloud import pubsub_v1
from google.cloud import storage
import json
import requests
import datetime

import imagen_lib as imagen
# imagen.MAX_SIZE = 704

import base64
import os
from dotenv import load_dotenv
import sqlalchemy as db
import datetime


project_id = "732264051436"
subscription_id = "imagen-queue-sub"
timeout = 20.0

subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path(project_id, subscription_id)


load_dotenv()

db_user = os.environ["DB_USER"]  # e.g. 'my-database-user'
db_pass = os.environ["DB_PASS"]  # e.g. 'my-database-password'
db_name = os.environ["DB_NAME"]  # e.g. 'my-database'
db_ip = os.environ["DB_IP"]  # private address

storage_client = storage.Client()
bucket = storage_client.bucket('aicanvas-public-bucket')



def connect_unix_socket() -> db.engine.base.Engine:
    pool = db.create_engine(
        url = db.engine.url.URL.create(
            drivername="mysql+pymysql",
            username=db_user,
            password=db_pass,
            host=db_ip,
            port=3306,
            database=db_name,
        ))
    return pool

def getTable(name, engine):
    metadata = db.MetaData()
    return db.Table(name, metadata, autoload=True, autoload_with=engine)


def save_to_sql(data_to_add):
    # save image to db
    engine = connect_unix_socket()
    images = getTable('images', engine)

    query = db.insert(images).values(**data_to_add)
    engine.execute(query)


def save_to_bucket(save_path, generated, bucket_path):
    generated.save(save_path, quality=100)
    blob_path_save_image = bucket.blob(bucket_path)
    blob_path_save_image.upload_from_filename(save_path)



def push_to_clients(channel, data):
    APPSYNC_API_ENDPOINT_URL = "https://jsnbrfwmpfdkjnhocqnrnuibbq.appsync-api.us-east-1.amazonaws.com/graphql"

    query = """
        mutation Publish($data: AWSJSON!, $name: String!) {
            publish(data: $data, name: $name) {
                data
                name
            }
        }"""

    jsonData=json.dumps(data)
    variables = json.dumps(dict(name=channel, data=jsonData))

    headers = {'x-api-key' : "da2-xpnjchk6vbdfdi2qovntvm6fcq"}

    response = requests.post(APPSYNC_API_ENDPOINT_URL, json={'query': query, 'variables' : variables}, headers=headers)
    print(response.text)


def callback(message: pubsub_v1.subscriber.message.Message) -> None:
    # print(f"Received {message}.")
    data = json.loads(message.data)

    action = data['action']
    params = data['params']

    print(params)

    b64prompt = params['prompt']
    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")

    width = int(params['width'])
    height = int(params['height'])

    # todo send ws with cur image uuid

    if   action == 'new_image':
        generated = imagen.new_image(prompt, width, height)
    
    elif action == 'img_to_img':
        init_image = params['init_image']
        generated = imagen.image_to_image(prompt, width, height, init_image)

    elif action == 'outpainting':
        init_image = params['init_image']
        generated = imagen.outpainting(prompt, width, height, init_image, strength=0.2)
    
    elif action == 'inpaint_mask':
        init_image = params['init_image']
        mask = params['mask']
        generated = imagen.inpaint_mask(prompt, width, height, init_image, mask)
    
    else:
        return

    posX = int(params['posX'])
    posY = int(params['posY'])
    room = params['room']

    b64prompt = params['prompt']
    prompt = base64.b64decode(b64prompt)
    prompt = prompt.decode("utf-8")
    
    ts = str(datetime.datetime.now().strftime("%Y%m%d%H%M%S%f"))
    bucket_path = f'{room}/{ts}-{prompt}.webp'

    data_to_add = dict(
        path=bucket_path,
        posX=posX,
        posY=posY,
        width = width,
        height = height,
        prompt = prompt
    )


    save_path = f'/tmp/{ts}.webp'
    save_to_bucket(save_path, generated, bucket_path)

    data_to_add['action'] = 'new_image'
    push_to_clients(room, data_to_add)    

    data_to_bdd = dict(
        uuid = params['uuid'],
        path=bucket_path,
        status = 'generated'
    )
    json_request = dict(action='update_row', table = 'images', data = data_to_bdd)

    requests.post('https://sql-actions-jujlepts2a-ew.a.run.app', json = json_request)



    message.ack()


flow_control = pubsub_v1.types.FlowControl(max_messages=1)

streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback, flow_control=flow_control)
print(f"Listening for messages on {subscription_path}..\n")

# Wrap subscriber in a 'with' block to automatically call close() when done.
with subscriber:
    try:
        # When `timeout` is not set, result() will block indefinitely,
        # unless an exception is encountered first.
        streaming_pull_future.result()
    except :
        streaming_pull_future.cancel()  # Trigger the shutdown.
        streaming_pull_future.result()  # Block until the shutdown is complete.


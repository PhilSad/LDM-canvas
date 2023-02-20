import base64
from . import users_operations
from . import pubsub_operations
from . import db_operations
import requests
import uuid
from . import appsync_operations
from googleapiclient import discovery
import google.auth
from PIL import Image
import io
from io import BytesIO
import datetime
from google.cloud import storage


compute = discovery.build('compute', 'v1')
storage_client = storage.Client()
bucket = storage_client.bucket('aicanvas-public-bucket')

credentials, project_id = google.auth.default()



def get_vm_status():
    result = compute.instances().get(project='ai-canvas', zone='us-central1-a', instance='template-imagen-gpu-auto-1').execute()
    return result

def start_vm_if_not_started():
    """return boolean true if vm was already started """

    # print(credentials.to_json())

    result = compute.instances().get(project='ai-canvas', zone='us-central1-a', instance='template-imagen-gpu-auto-1').execute()


    if result["status"] != "RUNNING":
        compute.instances().start(project='ai-canvas', zone='us-central1-a', instance='template-imagen-gpu-auto-1').execute()
        return False
    return True


def imagen(action, params, topic_id):
    # send to gpu


    idinfo = users_operations.validate_access_token_and_get_user(params['credential'], verify = True)
    print('[DEBUG] user info')
    print(idinfo)
    if idinfo == False:
        return -1

    if not db_operations.user_can_generate(idinfo['email']):
        return -1
    


    image_uuid = str(uuid.uuid4())
    params['uuid'] = image_uuid

    pubsub_operations.send_pubsub(action = action, params = params, topic_id=topic_id)
   
    # alert fronts that a new image is generating

    params['action'] = "generating_image"
    
    queue_size = db_operations.get_queue_size()
    params['queue_size'] = queue_size
    appsync_operations.push_to_clients(params['room'], params)


    data_to_bdd = dict(
        uuid = image_uuid,
        posX = params['posX'],
        posY = params['posY'],
        width = params['width'],
        height = params ['height'],
        prompt = base64.b64decode(params['prompt']).decode('utf-8'),
        room = params ['room'],
        status = 'waiting',
        email = idinfo['email']
    )

    db_operations.insert_to_sql("images", data_to_bdd)


    return 1


def save_to_bucket(save_path, generated, bucket_path):
    generated.save(save_path, quality=80)
    blob_path_save_image = bucket.blob(bucket_path)
    blob_path_save_image.upload_from_filename(save_path)



def send_to_gpu(colab_url, action, params):
    """Send a request to the colab gpu to generate an image
    colab_url: url of the colab notebook
    
    params: dict with the parameters to send to the colab notebook
    return: image generated by the colab notebook
    """

    result = requests.post(colab_url, json = dict(action = action, params = params))
    # decode image from base64 response
    content = result.content.decode('utf-8')
    img = Image.open(BytesIO(base64.b64decode(content))) 
    return img
    

def gpu_imagen(colab_url, action, params):
    """Send a request to the colab gpu to generate an image
    colab_url: url of the colab notebook
    params: dict with the parameters to send to the colab notebook
    """
    
    idinfo = users_operations.validate_access_token_and_get_user(params['credential'], verify = True)
    print('[DEBUG] user info')
    print(idinfo)
    if idinfo == False:
        return -1



    image_uuid = str(uuid.uuid4())
    params['uuid'] = image_uuid
    params['action'] = "generating_image"
    
    
    # save waiting entry to bdd
    data_to_bdd = dict(
        uuid = image_uuid,
        posX = params['posX'],
        posY = params['posY'],
        width = params['width'],
        height = params ['height'],
        prompt = base64.b64decode(params['prompt']).decode('utf-8'),
        room = params ['room'],
        status = 'waiting',
        email = idinfo['email']
    )
    db_operations.insert_to_sql("images", data_to_bdd)


    # alert fronts that a new image is generating
    #TODO: only pass relevent params
    appsync_operations.push_to_clients(params['room'], params)

    # Send to gpu
    generated_image = send_to_gpu(colab_url, action = action, params = params)
    
    # todo: check image is safe
    is_safe = True
    
    # todo: save image to bucket
    ts = str(datetime.datetime.now().strftime("%Y%m%d%H%M%S%f"))
    room = params['room']
    prompt = base64.b64decode(params['prompt']).decode('utf-8')
    save_path = f'/tmp/{ts}.webp'
    bucket_path = f'{room}/{ts}-{prompt}.webp'
    
    save_to_bucket(save_path, generated_image, bucket_path)
    
    # update bdd to add that the image is done generating
    data_to_bdd = dict(
        uuid = params['uuid'],
        path=bucket_path,
        status = 'generated' if is_safe else 'unsafe'
    )
    db_operations.update_from_sql("images", data_to_bdd)
    

    
    # alert fronts ws that new image is ready
    data_to_client = dict(
        action = 'new_image' if is_safe else 'unsafe_image',
        path = bucket_path if is_safe else None,
        posX = params['posX'],
        posY = params['posY'],
        width = params['width'],
        height = params['height'],
        prompt = params['prompt']
    )
    
    appsync_operations.push_to_clients(params['room'], data_to_client)
    
    
    return 1
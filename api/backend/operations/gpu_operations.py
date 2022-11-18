import base64
from . import users_operations
from . import pubsub_operations
from . import db_operations
import requests
import uuid
from . import appsync_operations
from googleapiclient import discovery
import google.auth

compute = discovery.build('compute', 'v1')

credentials, project_id = google.auth.default()



def start_vm_if_not_started():
    """return boolean true if vm was already started """
    result = compute.instances().get(project='ai-canvas', zone='us-central1-a', instance='template-imagen-gpu-auto-1').execute()
    if hasattr(credentials, "service_account_email"):
        print('[DEBUG] SERVICE ACCOUNT')
        print(credentials.service_account_email)


    if result["status"] != "RUNNING":
        compute.instances().start(project='ai-canvas', zone='us-central1-a', instance='template-imagen-gpu-auto-1').execute()
        return False
    return True


def imagen(action, params, topic_id):
    # send to gpu


    idinfo = users_operations.validate_access_token_and_get_user(params['credential'])
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
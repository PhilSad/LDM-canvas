import functions_framework
from google.cloud import monitoring_v3
from google.cloud.monitoring_v3 import query
import json
from google.cloud import pubsub_v1


project_id = "ai-canvas"
topic_id = "imagen-queue"


client_publisher = pubsub_v1.PublisherClient()
topic_path = client_publisher.topic_path(project_id, topic_id)
client_monitor = monitoring_v3.MetricServiceClient()


headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '0'
}


def send_pubsub(action, params):
    data_to_send = dict(action = action,  params=params)

    data_str = json.dumps(data_to_send)
    data = data_str.encode("utf-8")
    
    future = client_publisher.publish(
        topic_path, data
    )

    return future.result()

def get_current_queue():
    result = query.Query(
            client_publisher,
            project_id,
            'pubsub.googleapis.com/subscription/num_undelivered_messages', 
            minutes=1).as_dataframe()
    queue_size = result['pubsub_subscription'][project_id]['imagen-queue-sub'][0]
    return queue_size


@functions_framework.http
def imagen(request):

    action = request.args.get('action')

    try:
        params = request.get_json()
    except:
        return ('pls work',209, headers)


    send_pubsub(action = action, params = params)

    queue_size = get_current_queue()

    return (str(queue_size), 200, headers)
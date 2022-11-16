import json
from google.cloud import pubsub_v1
import os

project_id = "ai-canvas"


client_publisher = pubsub_v1.PublisherClient()


def send_pubsub(action, params, topic_id):
    data_to_send = dict(action = action,  params=params)
    topic_path = client_publisher.topic_path(project_id, topic_id)

    data_str = json.dumps(data_to_send)
    data = data_str.encode("utf-8")
    
    future = client_publisher.publish(
        topic_path, data
    )

    return future.result()
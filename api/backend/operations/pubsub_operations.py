import json
from google.cloud import pubsub_v1

project_id = "ai-canvas"
topic_id = "imagen-queue"

client_publisher = pubsub_v1.PublisherClient()
topic_path = client_publisher.topic_path(project_id, topic_id)


def send_pubsub(action, params):
    data_to_send = dict(action = action,  params=params)

    data_str = json.dumps(data_to_send)
    data = data_str.encode("utf-8")
    
    future = client_publisher.publish(
        topic_path, data
    )

    return future.result()
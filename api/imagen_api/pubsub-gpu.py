
from concurrent.futures import TimeoutError
from google.cloud import pubsub_v1
import json
import requests

import imagen_lib as imagen

project_id = "732264051436"
subscription_id = "imagen-queue-sub"
timeout = 20.0

subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path(project_id, subscription_id)



URL_IMAGEN = "localhost:5000"


def callback(message: pubsub_v1.subscriber.message.Message) -> None:
    print(f"Received {message}.")
    data = json.loads(message.data)

    action = data['action']
    method = data['method']
    url_params  = data['url_params']
    post_params = data['post_params']

    if action == 'new_image':
        imagen.new_image(post_params)

    message.ack()


streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
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


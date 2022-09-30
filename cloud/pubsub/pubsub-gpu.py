
from concurrent.futures import TimeoutError
from google.cloud import pubsub_v1
import json
import requests

project_id = "732264051436"
subscription_id = "imagen-queue-sub"
# Number of seconds the subscriber should listen for messages
timeout = 20.0

subscriber = pubsub_v1.SubscriberClient()
# The `subscription_path` method creates a fully qualified identifier
# in the form `projects/{project_id}/subscriptions/{subscription_id}`
subscription_path = subscriber.subscription_path(project_id, subscription_id)



URL_IMAGEN = "localhost:5000"


def callback(message: pubsub_v1.subscriber.message.Message) -> None:
    print(f"Received {message}.")
    data = json.loads(message.data)

    action = data['action']
    method = data['method']
    url_params  = data['url_params']
    post_params = data['post_params']

    formated_url_params = '&'.join(f'{k}={v}' for k,v in url_params.items())
    formated_url = f'{URL_IMAGEN}/{action}/?{formated_url_params}'
    
    print(formated_url)
    print(post_params)

    resp = requests.request(method, formated_url, json=post_params)
    print(resp)
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


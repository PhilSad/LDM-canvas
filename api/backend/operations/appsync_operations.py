import json
import requests

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
import functions_framework
from googleapiclient import discovery

@functions_framework.http
def stop_vm(request):
    compute = discovery.build('compute', 'v1')
    result = compute.instances().stop(project='ai-canvas', zone='europe-west1-b ', instance='my-gpu').execute()
    return result
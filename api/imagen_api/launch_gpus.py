import subprocess
import sys
import time
import multiprocessing

if len(sys.argv) != 2:
    nb = 2
else:
    nb = sys.argv[1]

def dont_stop():
    command = ['python3', 'imagen.py']
    retval = 1
    while retval != 0:      # a return value of zero indicates a normal exit
        print('lauchning process')
        retval = subprocess.call(command)
        time.sleep(1)

for _ in range(nb):
    p = multiprocessing.Process(name = 'pubsub_gpu_1', target=dont_stop)
    p.start()


#multiprocessing.Process(name = 'pubsub_gpu_1', target=dont_stop)

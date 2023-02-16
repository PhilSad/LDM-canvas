from crypt import methods
from random import random
import dotenv
dotenv.load_dotenv('.env')

from flask import Flask
from flask_cors import CORS
from flask import request
from operations import *
import random

app = Flask(__name__)
CORS(app)
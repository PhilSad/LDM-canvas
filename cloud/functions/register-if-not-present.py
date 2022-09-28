import functions_framework
import os
import sqlalchemy as db
from sqlalchemy.orm import Session

client_id = "732264051436-0jgjer21ntnoi5ovilmgtqpghaj286sv.apps.googleusercontent.com"


def connect_unix_socket() -> db.engine.base.Engine:
    db_user = os.environ["DB_USER"]  # e.g. 'my-database-user'
    db_pass = os.environ["DB_PASS"]  # e.g. 'my-database-password'
    db_name = os.environ["DB_NAME"]  # e.g. 'my-database'
    unix_socket_path = os.environ["INSTANCE_UNIX_SOCKET"]  # e.g. '/cloudsql/project:region:instance'

    pool = db.create_engine(
        db.engine.url.URL.create(
            drivername="mysql+pymysql",
            username=db_user,
            password=db_pass,
            database=db_name,
            query={"unix_socket": unix_socket_path},),)
            
    return pool


@functions_framework.http
def register_if_not_present(request):

    token = request.args.get("credentials")
    try:
        #validate token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)


        engine = connect_unix_socket()
        metadata = db.MetaData()
        users = db.Table('users', metadata, autoload=True, autoload_with=engine)
        
        with Session(engine) as session:
            present = session.query(users).filter_by(email = idinfo["email"]).first()
            if not present:
                data_to_add = dict(
                    email = idinfo["email"],
                    name = idinfo["name"]
                )
                query = db.insert(users).values(**data_to_add)
                engine.execute(query)

    
    except ValueError:
        print("Some finicky shits")


    return 'OK'
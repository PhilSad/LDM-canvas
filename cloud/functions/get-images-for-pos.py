import os
import sqlalchemy as db


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
            query={"unix_socket": unix_socket_path},
        ))
    return pool



headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '0'
}


def imagine(request):
    engine = connect_unix_socket()
    connection = engine.connect()

    metadata = db.MetaData()
    images = db.Table('images', metadata, autoload=True, autoload_with=engine)

    prompt = request.args.get('prompt')
    posX = int(request.args.get('posX'))
    posY = int(request.args.get('posY'))
    width = int(request.args.get('width'))
    height = int(request.args.get('height'))
    
    res = engine.execute(db.text('select * from images'))
    res = [dict(path=r[1], posX=r[2],posY=r[3],width=r[4],height=r[5]) for r in res]

    return (dict(message=res), 201, headers)
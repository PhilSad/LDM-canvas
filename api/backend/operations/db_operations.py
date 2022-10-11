import os
import sqlalchemy
import sqlalchemy as db
import traceback
import logging



def connect_unix_socket() -> sqlalchemy.engine.base.Engine:
    db_user = os.environ["DB_USER"]  # e.g. 'my-database-user'
    db_pass = os.environ["DB_PASS"]  # e.g. 'my-database-password'
    db_name = os.environ["DB_NAME"]  # e.g. 'my-database'
    unix_socket_path = os.environ["INSTANCE_UNIX_SOCKET"]  # e.g. '/cloudsql/project:region:instance'

    pool = sqlalchemy.create_engine(
        sqlalchemy.engine.url.URL.create(
            drivername="mysql+pymysql",
            username=db_user,
            password=db_pass,
            database=db_name,
            query={"unix_socket": unix_socket_path},
        )
    )
    return pool

engine = connect_unix_socket()



def get_queue_size():
    table = 'images'
    if type(table) == str:
        table = get_table(table)

    query = db.select(table).where(table.c.status == 'waiting')
    res = engine.execute(query)
    return len([r[0] for r in res])

def insert_to_sql(table, row_to_add):
    if type(table) == str:
        table = get_table(table)
    query = db.insert(table).values(**row_to_add)
    engine.execute(query)


def update_from_sql(table, row_to_update):
    if type(table) == str:
        table = get_table(table)

    query = db.update(table).where(table.c.uuid==row_to_update['uuid']).values(**row_to_update)
    engine.execute(query)


def get_table(name):
    return db.Table(name, db.MetaData(), autoload=True, autoload_with=engine)


def get_images_from_room(room):

    images = get_table('images')
    stmt = db.select(images).where(images.columns.room == room )
    result = engine.execute(stmt)

    result_as_dict = result.mappings().all()
    result_as_dict = [dict(res) for res in result_as_dict]
    
    return result_as_dict
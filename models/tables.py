# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

import datetime
from fs_s3fs import S3FS
from fs.copy import copy_fs


def get_user_email():
    return auth.user.email if auth.user else None


s3fs = S3FS(
    bucket_name='cvscan-files',
    aws_access_key_id='',
    aws_secret_access_key='',
    endpoint_url='',
    aws_session_token='',
    region=''
)

db.define_table('scans',
                Field('created_on', 'datetime', default=datetime.datetime.utcnow(), uploadfs=PyFileSystem.uploadfs),
                Field('created_by', default=get_user_email(), uploadfs=PyFileSystem.uploadfs),
                Field('scan_url', uploadfs=PyFileSystem.uploadfs),
                Field('four_corners', 'list:integer', uploadfs=PyFileSystem.uploadfs)
                )
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

cvscan_bucket = S3FS(
    bucket_name='cvscan-files',
    aws_access_key_id='',
    aws_secret_access_key='',
    region='us-west-1'
)


def get_user_email():
    return auth.user.email if auth.user else None


db.define_table('user_images',
                Field('created_on', 'datetime', default=request.now, uploadfs=cvscan_bucket),
                Field('created_by', 'reference auth_user', default=auth.user_id, uploadfs=cvscan_bucket),
                Field('image_url', 'string', uploadfs=cvscan_bucket),
                Field('is_selected', 'boolean', default=False, uploadfs=cvscan_bucket)
                )

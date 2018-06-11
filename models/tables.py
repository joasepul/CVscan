# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

import datetime
from fs import open_fs
import os


access_key = os.environ["access_key"]
secret_key = os.environ["secret_key"]
cvscan_bucket = open_fs('s3://' + access_key + ':' + secret_key + '@cvscan-album')


def get_user_email():
    return auth.user.email if auth.user else None


db.define_table('user_documents',
                Field('created_on', 'datetime', default=datetime.datetime.utcnow(), uploadfs=cvscan_bucket),
                Field('created_by', 'reference auth_user', default=get_user_email(), uploadfs=cvscan_bucket),
                Field('file_url', uploadfs=cvscan_bucket)
                )

# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)

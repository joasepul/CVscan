
import datetime

def get_user_email():
    return auth.user.email if auth.user else None

db.define_table('user_images',
                Field('user_email', default=get_user_email()),
                Field('image_url'),
                Field('is_selected', 'boolean', default = False),
                Field('created_on', 'datetime', default=request.now),
                Field('created_by', 'reference auth_user', default=auth.user_id)
                )
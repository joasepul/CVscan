import base64
from PIL import Image
import cv2
from StringIO import StringIO
import numpy as np
from computer_vision import *


def get_image():

    images = []
    image_url = db().select(db.user_images.ALL)
    for i,r in enumerate(image_url):
            img = dict(
                created_on=r.created_on,
                created_by=r.created_by,
                image_url=r.image_url,
                user_email=r.user_email,
                four_corners=r.four_corners,
                id=r.id,
            )
            images.append(img)
    if auth.user is not None:
        email = auth.user.email
    else:
        email = ''
    return response.json(dict(
        images=images,
        user_email=email,
    ))


def add_image():
    image_id = db.user_images.insert(
        image_url=request.vars.image_url,
    )
    user_images = dict(
        id=image_id,
        image_url=request.vars.image_url,
    )
    return response.json(dict(user_images=user_images,
    ))


#taken from
# https://stackoverflow.com/questions/33754935/read-a-base-64-encoded-image-from-memory-using-opencv-python-library
def readb64(base64_string):
    sbuf = StringIO()
    sbuf.write(base64.b64decode(base64_string))
    pimg = Image.open(sbuf)
    return cv2.cvtColor(np.array(pimg), cv2.COLOR_RGB2BGR)


def doc_alg_entry():
    img_b64 = (request.vars.img_b64)[22:]
    img = readb64(img_b64)
    ret, dst = doc_algorithm(img)
    retval, buffered_img = cv2.imencode('.png', dst)
    base64_encoded_image = base64.b64encode(buffered_img)
    height, width, channels = img.shape
    #print(ret)
    return response.json(dict(
        b64img=base64_encoded_image,
        qos='ret',
        width=width,
        height=height,
    ))

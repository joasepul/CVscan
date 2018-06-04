import base64
from PIL import Image
import cv2
from StringIO import StringIO
import numpy as np
from computer_vision import *

#taken from https://stackoverflow.com/questions/33754935/read-a-base-64-encoded-image-from-memory-using-opencv-python-library
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

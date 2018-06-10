import base64
from PIL import Image
import cv2
from StringIO import StringIO
import numpy as np
from computer_vision import *
#from fpdf import FPDF

downscale = 0.5

#taken from https://stackoverflow.com/questions/33754935/read-a-base-64-encoded-image-from-memory-using-opencv-python-library
def readb64(base64_string):
    sbuf = StringIO()
    sbuf.write(base64.b64decode(base64_string))
    pimg = Image.open(sbuf)
    return cv2.cvtColor(np.array(pimg), cv2.COLOR_RGB2BGR)


def rectify_doc():
    img_b64 = request.post_vars.img_b64
    points_from_client = request.post_vars.corners
    img = readb64(img_b64)
    orig_pts = order_points(np.float32(points_from_client))
    new_pts = order_points(np.float32([[0,0],[0,842],[595,842],[595,0]]))
    dst = doc_rectification(orig_pts, new_pts, img)
    retval, buffered_img = cv2.imencode('.png', dst)
    base64_encoded_image = base64.b64encode(buffered_img)
    height, width, channels = dst.shape
    return response.json(dict(
        b64img=base64_encoded_image,
        width=width,
        height=height,
    ))


def doc_alg_entry():
    img_b64 = request.post_vars.img_b64
    img = readb64(img_b64)
    ret, dst = doc_algorithm(img)
    if ret:
        retval, buffered_img = cv2.imencode('.png', dst)
    else:
        rescaled_raw_img = small = cv2.resize(img, (0,0), fx=downscale, fy=downscale)
        retval, buffered_img = cv2.imencode('.png', rescaled_raw_img)
    base64_encoded_image = base64.b64encode(buffered_img)
    height, width, channels = dst.shape
    return response.json(dict(
        b64img=base64_encoded_image,
        qos=ret,
        width=width,
        height=height,
    ))

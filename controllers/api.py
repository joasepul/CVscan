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
    img = readb64(img_b64)
    pt1 = request.post_vars["pt1[]"]
    print(pt1)
    pt2 = request.post_vars["pt2[]"]
    print(pt2)
    pt3 = request.post_vars["pt3[]"]
    print(pt3)
    pt4 = request.post_vars["pt4[]"]
    print(pt4)

    points_from_client = [[float(pt[0]), float(pt[1])] for pt in [pt1,pt2,pt3,pt4]]
    orig_pts = order_points(np.float32(points_from_client))
    new_pts = order_points(np.float32([[0,0],[0,paper_size[1]],[paper_size[0],paper_size[1]],[paper_size[0],0]]))
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
    orientation = request.post_vars.orientation
    img = readb64(img_b64)
    if orientation == "6":
        img = np.rot90(img, 3)
    elif orientation == "3":
        img = np.rot90(img, 2)
    elif orientation == "8":
        img = np.rot90(img)
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

@auth.requires_login()
def add_pdf():
    print('adding pdf')
    pdf_id = db.user_documents.insert(
        pdf_uri = request.vars.pdf_uri,
        title = request.vars.title ,
    )
    pdf = db.user_documents(pdf_id)
    print(pdf.title)
    print('pdf added')
    return response.json(dict(pdf = pdf))

@auth.requires_login()
def get_pdfs():
    print('getting pdfs')
    auth_id = auth.user.id
    pdfList = []
    row = db(db.user_documents.created_by == auth.user.id).select(orderby=~db.user_documents.created_on)
    for r in row:
        t = dict(
            title = r.title,
            created_on = r.created_on,
            pdf_uri = r.pdf_uri,
            id = r.id,
        )
        pdfList.append(t)
    print('got pdfs')
    return response.json(dict(
        pdfList = pdfList,
    ))

@auth.requires_login()
def del_pdf():
    db(db.user_documents.id == request.vars.pdf_id).delete()
    return "ok"

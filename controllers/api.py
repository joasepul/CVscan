import base64, os
from PIL import Image
import cv2
from StringIO import StringIO
import numpy as np
from computer_vision import *
#from fpdf import FPDF

downscale = 0.5
localstorage_path = os.path.join('applications',request.application,'localstorage')
try:
    os.makedirs(localstorage_path)
except OSError:
    if not os.path.isdir(localstorage_path):
        raise

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
    pdf_blob = request.post_vars['pdf_blob']
    title = request.post_vars['title']
    row = db(db.user_documents.id != None).select().last()
    idx = 0
    if row is not None:
        idx = row.id + 1
    else:
        idx = 1
    # idx = idx + 1
    print(auth.user.id)
    print(idx)
    filename = os.path.join(localstorage_path, str(auth.user.id) + "_" + str(idx))
    file = open(filename, 'wb')
    file.write(pdf_blob.file.read())
    file.close()
    pdf_id = db.user_documents.insert(
        pdf_blob = filename,
        title = title,
    )
    pdf = db.user_documents(pdf_id)
    print(pdf.title)
    print(pdf.pdf_blob)
    print('pdf added')
    pdf_blob.read_binary()
    return response.json(dict(pdf = pdf))

@auth.requires_login()
def get_pdfs():
    print('getting pdfs')
    pdfList = []
    row = db(db.user_documents.created_by == auth.user.id).select(orderby=~db.user_documents.created_on)
    for r in row:
        t = dict(
            title = r.title,
            created_on = r.created_on,
            pdf_blob = r.pdf_blob,
            id = r.id,
        )
        pdfList.append(t)
    print('got pdfs')
    return response.json(dict(
        pdfList = pdfList,
    ))

@auth.requires_login()
def del_pdf():
    row = db(db.user_documents.id == request.vars.pdf_id).select().first()
    idx = row.id
    directoryList = os.listdir(localstorage_path)
    filename = str(auth.user.id) + "_" + str(idx)
    if filename not in directoryList:
        filename = str(auth.user.id) + "_1"


    filepath = os.path.join(localstorage_path, filename)
    os.remove(filepath)
    db(db.user_documents.id == request.vars.pdf_id).delete()
    return "ok"

@auth.requires_login()
def download_pdf():
    r = db(db.user_documents.id == request.vars.pdf_id).select().first()
    path = r.pdf_blob
    filename = r.title
    print(path)
    print(filename)
    file = open(path, 'rb')
    fileContent = base64.b64encode(file.read())
    file.close()
    return response.json(dict(
        fileContent = fileContent,
        filename = filename,
    ))

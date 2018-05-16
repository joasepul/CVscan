import cv2
import numpy as np
from matplotlib import pyplot as plt

def doc_algorithm(img):
    #threshold image
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ret, thresh = cv2.threshold(gray,0,255,cv2.THRESH_OTSU)

    #find sure_bg and sure_fg and uknown areas
    kernel = np.ones((3,3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations = 2)
    sure_bg = cv2.dilate(opening,kernel,iterations=3)
    dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2,5)
    ret, sure_fg = cv2.threshold(dist_transform, 0.7*dist_transform.max(), 255,0)
    sure_fg = np.uint8(sure_fg)
    unknown = cv2.subtract(sure_bg, sure_fg)

    #run watershed algorithm
    ret, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown==255] = 0
    markers = cv2.watershed(img, markers)
    img[markers == -1] = [255,0,0]

    #segment background using flood fill

    #run Shi-Tomasi corner algorithm, find 4 corners

    #rectify image
    #https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_imgproc/py_geometric_transformations/py_geometric_transformations.html

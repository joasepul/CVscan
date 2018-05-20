import cv2
import numpy as np

def order_points(pts):
    rect = np.zeros((4, 2), dtype = "float32")

    s = pts.sum(axis = 1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis = 1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect

def doc_algorithm(img):
    def doc_algorithm(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ret, thresh = cv2.threshold(gray,0,255,cv2.THRESH_OTSU)
    kernel = np.ones((3,3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations = 2)

    sure_bg = cv2.dilate(opening,kernel,iterations=3)
    dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2,5)
    ret, sure_fg = cv2.threshold(dist_transform, 0.7*dist_transform.max(), 255,0)
    sure_fg = np.uint8(sure_fg)
    unknown = cv2.subtract(sure_bg, sure_fg)
    ret, markers = cv2.connectedComponents(sure_fg)

    markers = markers + 1
    markers[unknown==255] = 0
    markers = cv2.watershed(img, markers)
    markers[markers == 1] = 0
    markers[markers != 0] = 1
    m = cv2.convertScaleAbs(markers)
    ret,thresh = cv2.threshold(m,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    h,w = thresh.shape[:2]
    thresh[0,:] = 0
    thresh[:,0] = 0
    thresh[h-1,:] = 0
    thresh[:,w-1] = 0
    res = cv2.bitwise_and(img,img,mask=thresh)

    im2,contours,hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    cnt = contours[0]
    hull = cv2.convexHull(cnt)
    #cv2.drawContours(res,[hull],0,(0,255,0),20)

    perimeter = cv2.arcLength(cnt,True)
    delta = 0.01
    while delta < 1.0:
        epsilon = delta*cv2.arcLength(cnt,True)
        approx = cv2.approxPolyDP(cnt,epsilon,True)
        delta = delta + 0.01
        if approx.shape[0] == 4:
            break
    cv2.drawContours(res,[approx],0,(0,255,0),20)

    pts2 = order_points(np.float32([[0,0],[0,1500],[1000,1500],[1000,0]]))
    pts1 = order_points(np.float32([x[0] for x in approx ]))
    M = cv2.getPerspectiveTransform(pts1, pts2)
    dst = cv2.warpPerspective(img,M,(1000,1500))
    return dst

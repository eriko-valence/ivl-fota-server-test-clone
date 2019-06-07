import json
import requests
import time
import os
import sys
import email.utils 
import datetime
import logging
from multiprocessing import Process

# Main endpoint for the FOTA API
WEBAPI_ENDPOINT='ivlapiadmin-dev.azurewebsites.net'

# You need to log into the WebUI, and inspect the headers when it hits the API.  
# Then extract out the token it uses in the Authorization header and paste it below
AUTH_TOKEN='eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IkN0ZlFDOExlLThOc0M3b0MyelFrWnBjcmZPYyIsImtpZCI6IkN0ZlFDOExlLThOc0M3b0MyelFrWnBjcmZPYyJ9.eyJhdWQiOiJodHRwczovL2l2bGFwaWFkbWluLWRldi5henVyZXdlYnNpdGVzLm5ldCIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzI1NTM4NmMwLTk3NDEtNDcyNS1hNDhlLWIyYjE1Njc3MDZkOS8iLCJpYXQiOjE1NTk5MzAwMzksIm5iZiI6MTU1OTkzMDAzOSwiZXhwIjoxNTU5OTMzOTM5LCJhY3IiOiIxIiwiYWlvIjoiNDJaZ1lCRGlsdHcvVmFaTDJGMjdNL0pxMmF0S1EzT2x0bnhuanMvL2ZUTEVwL0FrSEFZQSIsImFtciI6WyJwd2QiXSwiYXBwaWQiOiIxMDMwYjE5ZC03YTZjLTQxNDYtODQzNi1lOTc3MjAwZmI4NDIiLCJhcHBpZGFjciI6IjAiLCJmYW1pbHlfbmFtZSI6IkNhcmxpc2xlIiwiZ2l2ZW5fbmFtZSI6Ik1hdHRoZXciLCJpcGFkZHIiOiI5Ni40Ni4xOS4yNDEiLCJuYW1lIjoiTWF0dGhldyBDYXJsaXNsZSIsIm9pZCI6IjFmZDhiM2NlLTlkMmItNDgxNS1iNmIzLTlmYzkzYWYwOTA5OCIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6IjZxSlVYMlBneFZLbWFtakRGdU1vX2luSGNyNUYzNm9waV9VYWZYVEZac1kiLCJ0aWQiOiIyNTUzODZjMC05NzQxLTQ3MjUtYTQ4ZS1iMmIxNTY3NzA2ZDkiLCJ1bmlxdWVfbmFtZSI6Im1hdHRoZXdjQHZhbGVuY2VsZXZlbC5jb20iLCJ1cG4iOiJtYXR0aGV3Y0B2YWxlbmNlbGV2ZWwuY29tIiwidXRpIjoiRzRfTS15dmFtVTJYN3RQUG93VVFBUSIsInZlciI6IjEuMCJ9.FjBONSo5Soz_vUL7mx-qH4vfn_WG3uyuDFrbpWm6QQAXkxCNjhuI5-PoQGbKZMIRY4yt_D8G5hfPfEDyqNJmz1drM-3DgB_TX0SJk9j-Ao9XexMz18JMz8ifqz6E6Wy8_C4x4zb1785U6bBIR96-abYwK0sguvuQWidfGR-e9geqAzz0NBBSgoRJDkUjKUElXMku9M4XU9RAm-GE9Av6aoMZZhTcUankxN6hWy8y_W_RB6aDl4K_0l6Wf5xXyZgsAr2_T8JCof2cC1w4FGBBI1HEP3N4I7Y8N-xLVJBh8TzoHK5oORD9hRHZMIPFAaQePZZfB-yzpdkv_qKtGCIjbQ'

# This is the fridgeID of the TestScript fridge (not a real one of course) that we expect to have control over
FRIDGE_ID="999"

# This is the internal ID and Name of the ValenceTestScript group that we expect to have control over
SCRIPT_GROUP_ID="8"
SCRIPT_GROUP_NAME = "ValenceTestScript"

# FIRMWARE NAME and ID of the firmware version we expect to have control over
SCRIPT_FIRMWARE_NAME = "v9.99.9-0-g9999"
SCRIPT_FIRMWARE_ID = "14"
SCRIPT_IMAGE = "mf-apps-v9.99.9-0-gabcd.bin"

# two minute timeout for service API hits
DOWNLOAD_TIMEOUT=120

logger = logging.getLogger(__name__)

# function to hit an endpoint and return a body if available
def test_endpoint(uri, expected=None, auth_token=None, method='GET', request_body=None):

    headers = {}

    logger.debug('Testing endpoint: {}'.format(uri))
    if request_body is not None:
        logger.debug('Sending payload: {}'.format(request_body))

    # if we have an authorization token passed in, we should use it
    if auth_token is not None:
        headers['Authorization'] = 'Bearer {}'.format(auth_token)
    

    if method == 'GET':
        if headers:
            response = requests.get(uri, timeout=DOWNLOAD_TIMEOUT, headers=headers)
        else:
            response = requests.get(uri, timeout=DOWNLOAD_TIMEOUT)


    elif method == 'PUT':
        if request_body is None:
            logger.error('FAIL: method is a PUT but have no request_body to send')
            return None

        headers['content-type'] = 'application/json'

        # hit device API
        response = requests.put(uri, timeout=DOWNLOAD_TIMEOUT, headers=headers, data=request_body)

    elif method == 'POST':
        if request_body is None:
            logger.error('FAIL: method is a POST but have no request_body to send')
            return None

        headers['content-type'] = 'application/json'

        # hit device API
        response = requests.post(uri, timeout=DOWNLOAD_TIMEOUT, headers=headers, data=request_body)

    elif method == 'DELETE':
        # hit device API
        if headers:
            response = requests.delete(uri, timeout=DOWNLOAD_TIMEOUT, headers=headers)
        else:
            response = requests.delete(uri, timeout=DOWNLOAD_TIMEOUT)

    else:
        logger.error('FAIL: Invalid method passed in to test_endpoint function')
        return None

    # did we fail to get a response?
    if response is None:
        logger.error('FAIL: Could not contact API endpoint {}'.format(uri))
        return None

    # do we have a certain expected result?
    if expected is not None:
        if expected == response.status_code:
            logger.info('SUCCESS: expected and received {}'.format(expected))
        else:
            if response.content is not None and response.text != '':
                logger.debug('Response test: {}'.format(response.text))
            logger.error('FAIL: expected {} but received {}'.format(expected, response.status_code))

    return response

def run_401_tests():
    # Authentication/Authorization tests (Devices Endpoint)
    logtest('Testing device GET endpoint with no AUTH token')
    test_endpoint('https://{}/v1/devices'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='GET')
    logtest('Testing device GET endpoint with incorrect token')
    test_endpoint('https://{}/v1/devices'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='GET')
    logtest('Testing device PUT endpoint with no AUTH token')
    test_endpoint('https://{}/v1/devices/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='PUT', request_body='{}')
    logtest('Testing device PUT endpoint with incorrect token')
    test_endpoint('https://{}/v1/devices/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='PUT', request_body='{}')

    # Authentication/Authorization tests (Groups Endpoint)
    logtest('Testing groups GET endpoint with no AUTH token')
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='GET')
    logtest('Testing groups GET endpoint with incorrect token')
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='GET')
    logtest('Testing groups PUT endpoint with no AUTH token')
    test_endpoint('https://{}/v1/groups/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='PUT', request_body='{}')
    logtest('Testing groups PUT endpoint with incorrect token')
    test_endpoint('https://{}/v1/groups/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='PUT', request_body='{}')
    logtest('Testing groups POST endpoint with no AUTH token')
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='POST', request_body='{}')
    logtest('Testing groups POST endpoint with incorrect token')
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='POST', request_body='{}')
    logtest('Testing groups DELETE endpoint with no AUTH token')
    test_endpoint('https://{}/v1/groups/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='DELETE')
    logtest('Testing groups DELETE endpoint with incorrect token')
    test_endpoint('https://{}/v1/groups/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='DELETE')

    # Authentication/Authorization tests (Firmware Endpoint)
    logtest('Testing firmware GET endpoint with no AUTH token')
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='GET')
    logtest('Testing firmware GET endpoint with incorrect token')
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='GET')
    logtest('Testing firmware POST endpoint with no AUTH token')
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='POST', request_body='{}')
    logtest('Testing firmware POST endpoint with incorrect token')
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='POST', request_body='{}')
    logtest('Testing firmware DELETE endpoint with no AUTH token')
    test_endpoint('https://{}/v1/firmware/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='DELETE')
    logtest('Testing firmware DELETE endpoint with incorrect token')
    test_endpoint('https://{}/v1/firmware/1'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='DELETE')

    # Authentication/Authorization tests (upload_uri Endpoint)
    logtest('Testing upload_uri GET endpoint with no AUTH token')
    test_endpoint('https://{}/v1/upload_uri'.format(WEBAPI_ENDPOINT), expected=401, auth_token=None, method='GET')
    logtest('Testing upload_uri GET endpoint with incorrect token')
    test_endpoint('https://{}/v1/upload_uri'.format(WEBAPI_ENDPOINT), expected=401, auth_token='IncorrectToken', method='GET')


def test_firmware_get():
    # Test we can receive firmware 
    logtest('Testing firmware GET endpoint')
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=200, auth_token=AUTH_TOKEN, method='GET')

    # Test that the firmware endpoint gives us the correct information
    logtest('Testing response from firmware GET endpoint')
    success = True
    response = test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), auth_token=AUTH_TOKEN, method='GET')
    if response.status_code != 200:
        logger.error('FAIL: did not get 200 from firmware GET')
        success = False
    else:
        d = response.json()
        if len(d) <= 0:
            logger.error('FAIL: did not get any firmwares from the GET')
            success = False
        else:
            for k in [ 'firmware_id', 'version', 'signature', 'md5', 'uri']:
                if k not in d[0]:
                    logger.error('FAIL: Key {} not in firmware GET response'.format(k))
                    success = False

    if success:
        logger.info('SUCCESS: Retrieved list of devices from GET endpoint')

def check_sorted(l, key, reverse=False):
    # extract out a simple list from the payload
    simplelist = []
    for item in l:
        data = item[key]
        if data == None:
            data = ''
        simplelist.append(data)

    sortedsimplelist = simplelist.copy()
    sortedsimplelist.sort(reverse=reverse)

    if sortedsimplelist != simplelist:
        logger.debug('UNSORTED')
        logger.debug(str(simplelist))
        logger.debug('SORTED')
        logger.debug(str(sortedsimplelist))
        return False
    else:
        return True

def test_devices_get():
    # Test we can receive devices 
    logtest('Testing devices GET endpoint')
    test_endpoint('https://{}/v1/devices'.format(WEBAPI_ENDPOINT), expected=200, auth_token=AUTH_TOKEN, method='GET')

    # Test that the devices endpoint gives us the correct information
    logtest('Testing response from devices GET endpoint')
    success = True
    response = test_endpoint('https://{}/v1/devices'.format(WEBAPI_ENDPOINT), auth_token=AUTH_TOKEN, method='GET')
    if response.status_code != 200:
        logger.error('FAIL: did not get 200 from devices GET')
        success = False
    else:
        d = response.json()
        if len(d) <= 0:
            logger.error('FAIL: did not get any devices from the GET')
            success = False
        else:
            for k in [ 'deviceid', 'MFID', 'SN', 'ShortSN', 'group', 'group_id', 'desired_fw']:
                if k not in d[0]:
                    logger.error('FAIL: Key {} not in devices GET response'.format(k))
                    success = False

            if not check_sorted(d, 'deviceid', reverse=False):
                logger.error('FAIL: devices endpoint received a list that was not sorted in ascending order for default sort of deviceid')
                success = False

    if success:
        logger.info('SUCCESS: Retrieved list of devices from GET endpoint')

    # Test to see if we can sort
    for field in [ 'deviceid', 'group', 'group_id', 'desired_fw', 'reported_fw', 'last_reported']:    
        logtest('Testing ascending sorted response from devices GET endpoint for {}'.format(field))
        response = test_endpoint('https://{}/v1/devices?sort_by=asc({})'.format(WEBAPI_ENDPOINT, field), auth_token=AUTH_TOKEN, method='GET')
        if response.status_code != 200:
            logger.error('FAIL: did not get 200 from devices GET')
        else:
            d = response.json()
            if check_sorted(d, field, reverse=False):
                logger.info('SUCCESS: devices endpoint received sorted list in ascending order for {}'.format(field))
            else:
                logger.error('FAIL: devices endpoint received a list that was not sorted in ascending order for {}'.format(field))

        logtest('Testing descending sorted response from devices GET endpoint for {}'.format(field))
        response = test_endpoint('https://{}/v1/devices?sort_by=desc({})'.format(WEBAPI_ENDPOINT, field), auth_token=AUTH_TOKEN, method='GET')
        if response.status_code != 200:
            logger.error('FAIL: did not get 200 from devices GET')
        else:
            d = response.json()
            if check_sorted(d, field, reverse=True):
                logger.info('SUCCESS: devices endpoint received sorted list in descending order for {}'.format(field))
            else:
                logger.error('FAIL: devices endpoint received a list that was not sorted in descending order for {}'.format(field))

def test_groups_get():
    # Test we can receive groups 
    logtest('Testing groups GET endpoint')
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=200, auth_token=AUTH_TOKEN, method='GET')

    # Test that the groups endpoint gives us the correct information
    logtest('Testing response from groups GET endpoint')
    success = True
    response = test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), auth_token=AUTH_TOKEN, method='GET')
    if response.status_code != 200:
        logger.error('FAIL: did not get 200 from groups GET')
        success = False
    else:
        d = response.json()
        if len(d) <= 0:
            logger.error('FAIL: did not get any groups from the GET')
            success = False
        else:
            for k in [ 'group_id', 'name', 'desired_fw']:
                if k not in d[0]:
                    logger.error('FAIL: Key {} not in groups GET response'.format(k))
                    success = False

    if success:
        logger.info('SUCCESS: Retrieved list of groups from GET endpoint')

def logtest(text):
    logger.info("======================================================================")
    logger.info(text)

def test_devices_missing_and_invalid():
    logtest('Testing devices GET endpoint - invalid sort parameter')
    test_endpoint('https://{}/v1/devices?sort_by=asc(blah)'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='GET')

    logtest('Testing devices PUT endpoint - missing device_id')
    test_endpoint('https://{}/v1/devices/'.format(WEBAPI_ENDPOINT), expected=404, auth_token=AUTH_TOKEN, method='PUT', request_body='{}')

    logtest('Testing devices PUT endpoint - missing group_id in payload')
    test_endpoint('https://{}/v1/devices/{}'.format(WEBAPI_ENDPOINT, FRIDGE_ID), expected=400, auth_token=AUTH_TOKEN, method='PUT', request_body='{}')

    logtest('Testing devices PUT endpoint - invalid group_id in payload')
    test_endpoint('https://{}/v1/devices/{}'.format(WEBAPI_ENDPOINT, FRIDGE_ID), expected=400, auth_token=AUTH_TOKEN, method='PUT', request_body='{"group_id": "evil"}')

    logtest('Testing devices PUT endpoint - group_id not found in DB')
    test_endpoint('https://{}/v1/devices/{}'.format(WEBAPI_ENDPOINT, FRIDGE_ID), expected=400, auth_token=AUTH_TOKEN, method='PUT', request_body='{"group_id": "1234567890" }')

def test_groups_missing_and_invalid():
    logtest('Testing groups POST endpoint - missing name')
    request = { "desired_fw" : "hopethisdoesnotmatter" }
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing groups POST endpoint - missing desired_fw')
    request = { "name" : "ValenceTestScript_DELETEMEIFYOUSEEME" }
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing groups POST endpoint - invalid name (trying to use one that we think exists already)')
    request = { "name" : SCRIPT_GROUP_NAME, "desired_fw" : "hopethisdoesnotmatter" }
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing groups POST endpoint - non-existent device firmware')
    request = { "name" : "ValenceTestScript_DELETEMEIFYOUSEEME" , "desired_fw" : "v5.5.5.5.5.5.5.5.5." }
    test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing groups PUT endpoint - missing group_id in URI')
    request = { "name" : SCRIPT_GROUP_NAME , "desired_fw" : SCRIPT_FIRMWARE_NAME }
    test_endpoint('https://{}/v1/groups/'.format(WEBAPI_ENDPOINT), expected=404, auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))

    logtest('Testing groups PUT endpoint - missing name')
    request = { "desired_fw_id" : SCRIPT_FIRMWARE_ID }
    test_endpoint('https://{}/v1/groups/{}'.format(WEBAPI_ENDPOINT, SCRIPT_GROUP_ID), expected=400, auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))

    logtest('Testing groups PUT endpoint - invalid group_id')
    request = { "name" : "ValenceTestScript" , "desired_fw_id" : SCRIPT_FIRMWARE_ID }
    test_endpoint('https://{}/v1/groups/evil'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))

    logtest('Testing groups PUT endpoint - invalid fw id')
    request = { "name" : "ValenceTestScript" , "desired_fw_id" : "evil" }
    test_endpoint('https://{}/v1/groups/{}'.format(WEBAPI_ENDPOINT, SCRIPT_GROUP_ID), expected=400, auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))

    logtest('Testing groups PUT endpoint - cannot find group id in DB')
    request = { "name" : "ValenceTestScript" , "desired_fw_id" : SCRIPT_FIRMWARE_ID }
    test_endpoint('https://{}/v1/groups/5551234'.format(WEBAPI_ENDPOINT), expected=404, auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))

    logtest('Testing groups PUT endpoint - cannot find firmware_id in DB')
    request = { "name" : "ValenceTestScript" , "desired_fw_id" : "5625367" }
    test_endpoint('https://{}/v1/groups/{}'.format(WEBAPI_ENDPOINT, SCRIPT_GROUP_ID), expected=404, auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))

    logtest('Testing groups DELETE endpoint - missing group_id in URI')
    test_endpoint('https://{}/v1/groups/'.format(WEBAPI_ENDPOINT), expected=404, auth_token=AUTH_TOKEN, method='DELETE', request_body=json.dumps(request))

    logtest('Testing groups DELETE endpoint - invalid group_id in URI')
    test_endpoint('https://{}/v1/groups/evil'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='DELETE', request_body=json.dumps(request))

    logtest('Testing groups DELETE endpoint - group ID not in the DB')
    test_endpoint('https://{}/v1/groups/5551234'.format(WEBAPI_ENDPOINT), expected=404, auth_token=AUTH_TOKEN, method='DELETE', request_body=json.dumps(request))

    logtest('Testing groups DELETE endpoint - group ID in use by one or more devices')
    test_endpoint('https://{}/v1/groups/{}'.format(WEBAPI_ENDPOINT, SCRIPT_GROUP_ID), expected=400, auth_token=AUTH_TOKEN, method='DELETE', request_body=json.dumps(request))


def test_uploaduri():
    logtest('Testing uploaduri GET endpoint - missing name')
    test_endpoint('https://{}/v1/upload_uri'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='GET')

    logtest('Testing uploaduri GET endpoint - happy path')
    test_endpoint('https://{}/v1/upload_uri?name=mf-apps-v9.99.9-0-gabcd.bin'.format(WEBAPI_ENDPOINT), expected=200, auth_token=AUTH_TOKEN, method='GET')

    logtest('Testing uploaduri GET endpoint - inspecting response')
    response = test_endpoint('https://{}/v1/upload_uri?name={}'.format(WEBAPI_ENDPOINT, SCRIPT_IMAGE), auth_token=AUTH_TOKEN, method='GET')
    if 'sas_uri' not in response.json():
        logger.error('FAIL: sas_uri not in response from server: {}'.format(response.text))
    else:
        logger.info('SUCCESS: sas_uri is in response from server')

def test_firmware_missing_and_invalid():
    logtest('Testing firmware POST endpoint - missing version')
    request = {  "image" :  SCRIPT_IMAGE, "signature":  "TestScriptSignature==", "md5": "fakemd5"}
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - missing image')
    request = { "version" : "{}_DELETEIFYOUFINDME".format(SCRIPT_FIRMWARE_NAME), "signature":  "TestScriptSignature==", "md5": "fakemd5"}
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - missing signature')
    request = { "version" : "{}_DELETEIFYOUFINDME".format(SCRIPT_FIRMWARE_NAME), "image" :  SCRIPT_IMAGE, "md5": "fakemd5"}
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - missing md5')
    request = { "version" : "{}_DELETEIFYOUFINDME".format(SCRIPT_FIRMWARE_NAME), "image" :  SCRIPT_IMAGE, "signature":  "TestScriptSignature==" }
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - long version')
    longversion = "{}_DELETEIFYOUFINDME".format(SCRIPT_FIRMWARE_NAME) * 500
    request = { "version" : longversion, "image" : SCRIPT_IMAGE, "signature":  "TestScriptSignature==", "md5" : "fakemd5" }
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - long image')
    longimage = "DELETEIFYOUFINDME" * 500
    request = { "version" : "{}_DELETEIFYOUFINDME".format(SCRIPT_FIRMWARE_NAME), "image" : longimage, "signature":  "TestScriptSignature==", "md5" : "fakemd5" }
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - long signature')
    longsignature = "DELETEIFYOUFINDME" * 500
    request = { "version" : "{}_DELETEIFYOUFINDME".format(SCRIPT_FIRMWARE_NAME), "image" : SCRIPT_IMAGE, "signature":  longsignature, "md5" : "fakemd5" }
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - long md5')
    longmd5 = "DELETEIFYOUFINDME" * 500
    request = { "version" : "{}_DELETEIFYOUFINDME".format(SCRIPT_FIRMWARE_NAME), "image" : SCRIPT_IMAGE, "signature":  "TestScriptSignature==", "md5" : longmd5 }
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware POST endpoint - same version as existing firmware version in DB')
    request = { "version" : "{}".format(SCRIPT_FIRMWARE_NAME), "image" : 'deleteme-{}'.format(SCRIPT_IMAGE), "signature":  "TestScriptSignature==", "md5": "fakemd5"}
    test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))

    logtest('Testing firmware DELETE endpoint - deleting firmware attached to a group')
    test_endpoint('https://{}/v1/firmware/{}'.format(WEBAPI_ENDPOINT, SCRIPT_FIRMWARE_ID), expected=400, auth_token=AUTH_TOKEN, method='DELETE')

    logtest('Testing firmware DELETE endpoint - missing firmware id in URI')
    test_endpoint('https://{}/v1/firmware/'.format(WEBAPI_ENDPOINT), expected=404, auth_token=AUTH_TOKEN, method='DELETE')

    logtest('Testing firmware DELETE endpoint - invalid firmware id in URI')
    test_endpoint('https://{}/v1/firmware/evil'.format(WEBAPI_ENDPOINT), expected=400, auth_token=AUTH_TOKEN, method='DELETE')

    logtest('Testing firmware DELETE endpoint - non existent firmware id in DB')
    test_endpoint('https://{}/v1/firmware/3278738'.format(WEBAPI_ENDPOINT), expected=404, auth_token=AUTH_TOKEN, method='DELETE')

def test_happy_path_scenario():
    # We will do these things in this order:
    # -Create a new firmware
    # -Create a new group
    # -Assign our test device to this new group

    ## CREATE NEW FIRMWARE
    version='v5.55.5-0-gdeleteifyouseeme'
    image_name='mf-apps-{}.bin'.format(version)

    logtest('Testing getting upload uri for new firmware with name {}'.format(image_name))
    response = test_endpoint('https://{}/v1/upload_uri?name={}'.format(WEBAPI_ENDPOINT, image_name), auth_token=AUTH_TOKEN, method='GET')
    if response is None or response.status_code != 200:
        logger.error('FAIL: Did not get good response from upload_uri endpoint')
        logger.debug(response.text)
        logger.error('Bailing out of happy path test.')
        return False        
    if 'sas_uri' not in response.json():
        logger.error('FAIL: sas_uri not in response from server: {}'.format(response.text))
        logger.error('Bailing out of happy path test.')
        return False
    sas_uri = response.json()['sas_uri']
    logger.info("SUCCESS: Got sas_uri from API")

    # we are not actually going to upload to blob store because the Management API does not require this when we create the firmware
    request = { "version" : version, "image" : image_name, "signature":  "TestScriptSignature==", "md5" : "fakemd5"}
    logtest('Testing firmware POST endpoint')
    response = test_endpoint('https://{}/v1/firmware'.format(WEBAPI_ENDPOINT), auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))
    if response is None or response.status_code != 201:
        logger.error('FAIL: Did not get good response from POST endpoint')
        logger.debug(response.text)
        logger.error('Bailing out of happy path test.')
        return False        
    logger.debug(response.text)
    for k in [ 'firmware_id', 'version', 'signature', 'md5', 'uri']:
        if k not in response.json():
            logger.error('FAIL: Key {} not in firmware GET response'.format(k))
            logger.debug(response.text)

    # can we continue?
    if 'firmware_id' not in response.json():
        logger.error('Bailing out of happy path test - no firmware_id to work with')
        return False
    logger.info("SUCCESS: Created new firmware with API")

    # get firmware_id out of response
    firmware_id = response.json()['firmware_id']

    # CREATE A NEW GROUP
    logtest('Testing creating firmware group')
    request = { "desired_fw_id" : str(firmware_id) , "name" : "TestScriptGroup_DeleteIfYouSeeMe"}
    response = test_endpoint('https://{}/v1/groups'.format(WEBAPI_ENDPOINT), auth_token=AUTH_TOKEN, method='POST', request_body=json.dumps(request))
    if response is None or response.status_code != 201:
        logger.error('FAIL: Did not get good response from POST endpoint')
        logger.debug(response.text)
        logger.error('Bailing out of happy path test - deleting firmware first')
        test_endpoint('https://{}/v1/firmware/{}'.format(WEBAPI_ENDPOINT, firmware_id), expected=204, auth_token=AUTH_TOKEN, method='DELETE')
        return False        
    for k in [ 'group_id', 'name', 'desired_fw', 'firmware_id']:
        if k not in response.json():
            logger.error('FAIL: Key {} not in group POST response'.format(k))
            logger.debug(response.text)

    # can we continue?
    if 'group_id' not in response.json():
        logger.error('Bailing out of happy path test - no group_id to work with')
        return False
    group_id = response.json()['group_id']
    logger.info("SUCCESS: created new firmware group and assigned new firmware")

    # ASSIGN OUR TEST DEVICE TO OUR NEW GROUP
    logtest('Testing devices PUT endpoint - Assigning device to our new group')
    request = { "group_id": str(group_id) }
    response = test_endpoint('https://{}/v1/devices/{}'.format(WEBAPI_ENDPOINT, FRIDGE_ID), auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))
    if response is None or response.status_code != 200:
        logger.error('FAIL: Did not get good response from PUT endpoint')
        logger.debug(response.text)
    for k in [ 'deviceid', 'group_id', 'desired_fw', 'group']:
        if k not in response.json():
            logger.error('FAIL: Key {} not in Device PUT response'.format(k))
            logger.debug(response.text)
    # can we continue?
    if 'group_id' not in response.json():
        logger.error('Bailing out of happy path test - no group_id to work with')
        return False
    assigned_group_id = response.json()['group_id']
    if assigned_group_id != group_id:
        logger.error('FAIL: could not assign device {} to our new group with id {}'.format(FRIDGE_ID, group_id))
    else:
        logger.info("SUCCESS: created new firmware group and assigned new firmware")

    # Modify the group to assign the firmware to another firmware
    logtest('Testing modifying firmware group')
    request = { "desired_fw_id" : SCRIPT_FIRMWARE_ID , "name" : "TestScriptGroup_DeleteIfYouSeeMe"}
    response = test_endpoint('https://{}/v1/groups/{}'.format(WEBAPI_ENDPOINT, group_id), auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))
    if response is None or response.status_code != 200:
        logger.error('FAIL: Did not get good response from PUT endpoint')
        logger.debug(response.text)
    for k in [ 'group_id', 'name', 'desired_fw', 'firmware_id']:
        if k not in response.json():
            logger.error('FAIL: Key {} not in group PUT response'.format(k))
            logger.debug(response.text)
    modified_firmware_id = response.json()['firmware_id']
    if modified_firmware_id != SCRIPT_FIRMWARE_ID:
        logger.error('FAIL: could not successfully modify the firmware for the new group we just created')
        logger.debug(response.text)
    else:
        logger.info("SUCCESS: modified new firmware group and assigned to a different firmware")


    # Modify the group to give it a new name
    logtest('Testing modifying firmware group name')
    request = { "name" : "TestScriptGroup_DeleteIfYouSeeMeModified"}
    response = test_endpoint('https://{}/v1/groups/{}'.format(WEBAPI_ENDPOINT, group_id), auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))
    if response is None or response.status_code != 200:
        logger.error('FAIL: Did not get good 200 response from PUT endpoint - got {} instead'.format(response.status_code))
        logger.debug(response.text)
    for k in [ 'group_id', 'name', 'desired_fw', 'firmware_id']:
        if k not in response.json():
            logger.error('FAIL: Key {} not in groups PUT response'.format(k))
            logger.debug(response.text)
    if 'name' in response.json():
        modified_name = response.json()['name']
        if modified_name != 'TestScriptGroup_DeleteIfYouSeeMeModified':
            logger.error('FAIL: could not successfully modify the name for the new group we just created')
            logger.debug(response.text)
        else:
            logger.info("SUCCESS: modified new firmware group and changed its name")

    # ASSIGN OUR TEST DEVICE BACK TO THE ORIGINAL GROUP
    logtest('Testing devices PUT endpoint - Assigning device back to original group')
    request = { "group_id": SCRIPT_GROUP_ID }
    test_endpoint('https://{}/v1/devices/{}'.format(WEBAPI_ENDPOINT, FRIDGE_ID), expected=200, auth_token=AUTH_TOKEN, method='PUT', request_body=json.dumps(request))

    # DELETE THE GROUP WE JUST CREATED
    logtest('Testing deleting our firmware group we created')
    response = test_endpoint('https://{}/v1/groups/{}'.format(WEBAPI_ENDPOINT, group_id), auth_token=AUTH_TOKEN, method='DELETE')
    if response is None or response.status_code != 204:
        logger.error('FAIL: Did not get good response from DELETE endpoint - got {} instead of expected {}'.format(response.status_code, 204))
        logger.error('Bailing out of happy path test - deleting firmware first')
        test_endpoint('https://{}/v1/firmware/{}'.format(WEBAPI_ENDPOINT, firmware_id), expected=204, auth_token=AUTH_TOKEN, method='DELETE')
        return False        
    log.info('SUCCESS: Deleted our new firmware group')

    # DELETE THE NEW FIRMWARE WE JUST CREATED
    logtest('Testing deleting the new firmware we created')
    test_endpoint('https://{}/v1/firmware/{}'.format(WEBAPI_ENDPOINT, firmware_id), expected=204, auth_token=AUTH_TOKEN, method='DELETE')


def run_tests():

    # test all endpoints to make sure we get 401 from them all
    run_401_tests()

    test_uploaduri()
    test_groups_missing_and_invalid()
    test_devices_missing_and_invalid()
    test_firmware_missing_and_invalid()
    test_groups_get()
    test_firmware_get()
    test_devices_get()

    test_happy_path_scenario()
    

if __name__ == '__main__':
    logging.basicConfig(
            level=logging.NOTSET,
            format='%(relativeCreated)10.0f\t%(name)20s\t%(levelname)s\t%(message)s')

    # Python 3.6 on Mac uses the below logger for urllib
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)

    # This is for Python 3.4.3 on the Fridge - though it is actually the same module as urllib above
    logging.getLogger("requests.packages.urllib3.connectionpool").setLevel(logging.WARNING)

    # This is for local logging - set to DEBUG to see more stuff
    logging.getLogger("__main__").setLevel(logging.DEBUG)

    run_tests()
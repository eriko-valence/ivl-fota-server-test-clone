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
#WEBAPI_ENDPOINT='mf2fota-dev.2to8.cc'
WEBAPI_ENDPOINT='ivlapidevice-dev.azurewebsites.net'
#WEBAPI_ENDPOINT='fa-ivlfota-device-api-matt.azurewebsites.net'

# Key to use as API Key.  This is essentially a shared password for the application to gain access to the FOTA API
# It will be passed into the API via a request header "x-functions-key"
#WEBAPI_KEY = '10yE5/4TJ3cN9XhOXdSIPg2OVBDZ/dVuH/0DCzi4x1UFx6mHXV7uAw=='
#WEBAPI_KEY = '9K95QlYCX7HnSNgoTZlWPv0chCMf0DYqJ04SINqtE5QqNV0v9lUpag=='
WEBAPI_KEY = '7mp9jx2T1kcemowavLifuqL6PJarkDVPlptSFHaMHdgUV7fxG7PccA=='

# What FridgeID are we going to pretend to be? 999 is the Fridge devoted to the test script.
FRIDGE_ID='999'

# What FW Versions are we going to pretend to have currently installed?
SAME_FW='v9.99.9-0-g9999'   # this is intended to be the same version as desired for this fridge on the server  
NEWER_FW='v9.99.9-9-g1234'  # this is indended to be a newer version than is desired for this fridge on the server
OLDER_FW='v8.00.1-0-g5555'  # this is intended to be an older version than is desired for this fridge on the server

# two minute timeout for service API hits
DOWNLOAD_TIMEOUT=120

# number of concurrent checks we wish to perform in the load test
CONCURRENT_CHECKS=10
CONCURRENT_CHECKS_API_ONLY=50

logger = logging.getLogger(__name__)

def get_manifest(fridge_id=None, fridge_fw_ver=None, api_key=WEBAPI_KEY):

    # check to see if we got a fridgeID
    if fridge_id is None:
        api_endpoint = 'https://{}/v1/fota/fwcheck/'.format(WEBAPI_ENDPOINT)
    else:
        api_endpoint = 'https://{}/v1/fota/fwcheck/{}'.format(WEBAPI_ENDPOINT, fridge_id)
    
    # do we have a version?
    if fridge_fw_ver is not None:
        api_endpoint = '{}?ver={}'.format(api_endpoint, fridge_fw_ver)

    logger.debug('Hitting endpoint: {}'.format(api_endpoint))

    # do we have an API key to pass in?
    if api_key is not None:
        headers = {'x-functions-key': '{}'.format(api_key)}
    else:
        headers = None

    logger.debug('Request headers: {}'.format(str(headers)))

    current_ms = int(round(time.time() * 1000))

    try:
        # hit device API
        if headers is not None:
            response = requests.get(api_endpoint, timeout=DOWNLOAD_TIMEOUT, headers=headers)
        else:
            response = requests.get(api_endpoint, timeout=DOWNLOAD_TIMEOUT)

    except (requests.exceptions.Timeout, requests.packages.urllib3.exceptions.ReadTimeoutError):
        logger.error('FAIL - API timeout')
        return None, None

    final_ms = int(round(time.time() * 1000))

    # check we got some kind of response - we always want something!
    if response is None or response.headers is None:
        logger.error('FAIL - Bad HTTP response - either no response or no headers')
        return None, None

    logger.debug('Response Headers: {}'.format(str(response.headers)))

    # extract Date from response - we always want this as it is in the spec
    if 'Date' not in response.headers:
        logger.error('FAIL - Date header not in response so cannot use response')
        return response.status_code, None

    # extract out the body if there is one
    response_text = None
    if response.text is not None and response.text != '':
        response_text = response.text
        logger.debug("Response content: {}".format(response_text))

    logger.debug("API call took {} ms".format(final_ms - current_ms))

    return response.status_code, response_text


def test_same_fw():
    logger.info('--------------------------')    
    logger.info('TESTING SAME VERSION OF FIRMWARE LOCALLY AS DESIRED ON SERVER')
    expected = 204
    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID, fridge_fw_ver=SAME_FW)
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
        return True
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))
        return False


def test_newer_fw():
    logger.info('--------------------------')    
    logger.info('TESTING NEWER VERSION OF FIRMWARE LOCALLY AS DESIRED ON SERVER')
    expected = 204
    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID, fridge_fw_ver=NEWER_FW)
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))


def test_older_fw(index):
    logger.info('--------------------------')    
    logger.info('TEST Index {} - TESTING OLDER VERSION OF FIRMWARE LOCALLY AS DESIRED ON SERVER'.format(index))
    expected = 200

    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID, fridge_fw_ver=OLDER_FW)

    # did we get the right status code?
    if status_code != expected:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))
        return False

    # did we get a manifest?
    if manifest is None:
        logger.error('FAIL - Did not get a manifest from the server')
        return False

    try:
        manifest_dict = json.loads(manifest)

    except:
        logger.error('FAIL - could not parse response from server as JSON')
        return False

    # everything we expect in the manifest?
    for key in ['version', 'signature', 'uri', 'md5']:
        if key not in manifest_dict:
            logger.error('FAIL - Key ({}) not in body of response from manifest API call'.format(key))
            return False

    logger.info('SUCCESS - Test Index {} Received {} response from server as expected'.format(index, status_code))

def test_manifest_payload(index):
    logger.info('--------------------------')    
    logger.info('TEST Index {} - TESTING MANIFEST PAYLOAD WITH OLDER FIRMWARE'.format(index))
    expected = 200
    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID, fridge_fw_ver=OLDER_FW)

    # did we get the right status code?
    if status_code != expected:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))
        return False

    # did we get a manifest?
    if manifest is None:
        logger.error('FAIL - Did not get a manifest from the server')
        return False

    try:
        manifest_dict = json.loads(manifest)

    except:
        logger.error('FAIL - could not parse response from server as JSON')
        return FALSE

    # everything we expect in the manifest?
    for key in ['version', 'signature', 'uri', 'md5']:
        if key not in manifest_dict:
            logger.error('FAIL - Key ({}) not in body of response from manifest API call'.format(key))
            return False

    # now we check that the firmware binary link is http
    uri = manifest_dict['uri']
    if not uri.startswith('http:'):
        logger.error('FAIL - URI in manifest is not plain http: {}'.format(uri))
        return False

    # ok, now we need to try and download it - first do a HEAD operation and check for Etag and Content-Length
    response = requests.head(uri, timeout=DOWNLOAD_TIMEOUT)
    if response.status_code != 200:
        logger.error('FAIL - Received status code of {} instead of expected 200 for head operation on URI ({})'.format(response.status_code, uri))
        return False
    if 'Etag' not in response.headers:
        logger.error('FAIL - Server response to HEAD operation on uri ({}) did not include ETag'.format(uri))
        return False
    if 'Content-Length' not in response.headers:
        logger.error('FAIL - Server response to HEAD operation on uri ({}) did not include Content-Length'.format(uri))
        return False
    content_length = int(response.headers['Content-Length'])
    if content_length < 2:
        logger.error('FAIL - Content length is less than 2 bytes which means we cannot test a range download')
        return False

    # try a full download first
    response = requests.get(uri, timeout=DOWNLOAD_TIMEOUT)
    if response.status_code != 200:
        logger.error('FAIL - Got response code of {} when download URI {}'.format(response.status_code, uri))
        return False

    # now do a range download to make sure that is supported
    start_byte = int(content_length / 2)
    end_byte = content_length - 1
    headers = {'Range': 'bytes={}-{}'.format(start_byte, end_byte)}
    response = requests.get(uri, headers=headers, timeout=DOWNLOAD_TIMEOUT)
    if response.status_code != 206:
        logger.error('FAIL - Got response code of {} when Range downloading URI {}'.format(response.status_code, uri))
        return False

    logger.info('SUCCESS - Test Index {} downloaded firmware binary with full and range downloads as expected'.format(index))



def test_missing_fridge_id():
    logger.info('--------------------------')    
    logger.info('TESTING MISSING FRIDGE ID')
    expected = 404
    status_code, manifest = get_manifest(fridge_fw_ver=SAME_FW)
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))


def test_unknown_fridge_id():
    logger.info('--------------------------')    
    logger.info('TESTING UNKNOWN FRIDGE ID')
    expected = 404
    status_code, manifest = get_manifest(fridge_id='123456789555', fridge_fw_ver=SAME_FW)
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))


def test_invalid_fridge_id():
    logger.info('--------------------------')    
    logger.info('TESTING INVALID FRIDGE ID')
    expected = 400
    status_code, manifest = get_manifest(fridge_id='evilstring', fridge_fw_ver=SAME_FW)
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))


def test_missing_fridge_ver():
    logger.info('--------------------------')    
    logger.info('TESTING MISSING FRIDGE VERSION')
    expected = 400
    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID)
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))


def test_invalid_fridge_ver():
    logger.info('--------------------------')    
    logger.info('TESTING INVALID FRIDGE VERSION')
    expected = 400
    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID, fridge_fw_ver='evilstring')
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))


def test_missing_api_key():
    logger.info('--------------------------')    
    logger.info('TESTING MISSING API KEY')
    expected = 401
    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID, fridge_fw_ver=SAME_FW, api_key=None)
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))


def test_incorrect_api_key():
    logger.info('--------------------------')    
    logger.info('TESTING INCORRECT API KEY')
    expected = 401
    status_code, manifest = get_manifest(fridge_id=FRIDGE_ID, fridge_fw_ver=SAME_FW, api_key='thisisanincorrectapikey==')
    if status_code == expected:
        logger.info('SUCCESS - Received {} response from server as expected'.format(status_code))
    else:
        logger.error('FAIL - Received {} response from the server but was expecting {}'.format(status_code, expected))

def test_load_includingblob():
    logger.info('--------------------------')    
    logger.info('LOAD TESTING API with {} concurrent manifest checks and downloads'.format(CONCURRENT_CHECKS))
    process_list=[]

    # start up a whole bunch of them
    for x in range(CONCURRENT_CHECKS):
        p = Process(target=test_manifest_payload, args=(x,))
        process_list.append(p)
        p.start()

    # now wait for them all to finish
    for p in process_list:
        p.join()

    logger.info('SUCCESS - load testing finished for {} API checks and FW Downloads'.format(CONCURRENT_CHECKS))

def test_load_api_only():
    logger.info('--------------------------')    
    logger.info('LOAD TESTING API with {} concurrent manifest API checks'.format(CONCURRENT_CHECKS_API_ONLY))
    process_list=[]

    # start up a whole bunch of them
    for x in range(CONCURRENT_CHECKS_API_ONLY):
        p = Process(target=test_older_fw, args=(x,))
        process_list.append(p)
        p.start()

    # now wait for them all to finish
    for p in process_list:
        p.join()

    logger.info('SUCCESS - load testing finished for {} API checks (no FW download)'.format(CONCURRENT_CHECKS_API_ONLY))

def test_load_limit_api_only(amount, time_period):
    logger.info('--------------------------')    
    logger.info('LOAD TESTING API with {} concurrent manifest API checks over {} seconds'.format(amount, time_period))
    process_list=[]

    # start up a whole bunch of them over a one minute period
    for x in range(amount):
        p = Process(target=test_older_fw, args=(x, ))
        process_list.append(p)
        p.start()
        time.sleep(float(time_period)/amount)
        # go through the list of processes we currently have going and see which ones are finished
        new_process_list = []
        for p in process_list:
            if not p.is_alive():
                p.join()
                logger.info('JOINED WITH PROCESS')
            else:
                new_process_list.append(p)
        process_list = new_process_list

    # now wait for them all to finish
    for p in process_list:
        p.join()
        logger.info('JOINED WITH PROCESS AT END')

    logger.info('Load testing finished for {} API checks (no FW download) over {} seconds'.format(amount, time_period))


def basic_tests():
    logger.info('RUNNING BASIC FUNCTIONAL TESTS')
    test_same_fw()
    test_newer_fw()
    test_older_fw(0)
    test_missing_fridge_id()
    test_unknown_fridge_id()
    test_invalid_fridge_id()
    test_missing_fridge_ver()
    test_invalid_fridge_ver()
    test_missing_api_key()
    test_incorrect_api_key()
    test_manifest_payload(0)

def load_tests():
    logger.info('RUNNING LOAD TESTS')
    test_load_includingblob()
    test_load_api_only()

def load_limit_tests(amount, time_period):
    logger.info('RUNNING LOAD LIMIT TESTS')
    test_load_limit_api_only(amount, time_period)

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

    # basic tests or load tests?
    if len(sys.argv) > 1 and sys.argv[1] == '-load':
        load_tests()
    elif len(sys.argv) > 3 and sys.argv[1] == '-loadlimit':
        amount = int(sys.argv[2])
        time_period = int(sys.argv[3])
        load_limit_tests(amount, time_period)
    else:
        basic_tests()

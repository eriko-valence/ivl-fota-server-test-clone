# Test Instructions
All development and testing of these scripts was performed on a Mac using python3.  No guarantees provided for correct operation on other platforms.  

## Device API
The script is configured to use a specific device that should be configured against a group with a specific firmware version.  This is so the script can validate it is getting correct responses for newer/same/older firmware.

See the `deviceapitest.py` script for more details.

To run:
`python3 deviceapitest.py 2> output.txt`

Inspect `output.txt` for the results.  Look for `FAIL` to see any failed tests.

The script will run a functional test of the Device API and then launch into a small load test where it simulates getting a firmware manifest and downloading from the provided URI, and then a larger load test where it concurrently hits the manifest endpoint more times.

The timeout for the script is set to 120 seconds which is the timeout set for the fridge FOTA agent code so should be representative of in-field performance.

## Management API
The script is configured with several expected IDs it expects to find in the DB.  Review `managementapitest.py` for more details.

One thing you will definitely need to modify before you run the script is the `AUTH_TOKEN` in the script.  You can find this by logging onto the ManagementUI and going to one of the screens (firmware is fine).  Review your network traces and find a Request Header called `Authorization`.  It will look something like this: 

`Bearer eyJ0eXAiOiJK6WyJwd2QiXSwiYXBwaWQiOiIxM...`

Copy everything after `Bearer ` and paste into the script to replace the existing `AUTH_TOKEN`.  All of it.  Make sure you don't mess up the Python single quotes on either side of the token.

To run:
`python3 managementapitest.py 2> output.txt`

Inspect `output.txt` for the results.  Look for `FAIL` to see any failed tests.

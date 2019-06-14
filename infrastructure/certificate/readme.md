# SSL Instructions
This folder contains the public and private keys for the mf2fota-dev.2to8.cc domain.  Note that this is the DEV certificate.  It is NOT recommended that the private key for the PROD (mf2fota-prod.2to8.cc) environment be put in git. Instead, keep the prod certificate and key in a safe place and use the instructions below to help you make the required password protected PFX file to upload to Azure.  And maybe use a better password for your prod PFX than you see below, OK?

## PFX Password
Password: kitten123

## PFX Creation
Certificate was created on a Mac using the following command:
```
openssl pkcs12 -export -out mf2fota-dev.pfx -inkey privatekey.key -in mf2fota-dev_2to8_cc_cert.crt 
```

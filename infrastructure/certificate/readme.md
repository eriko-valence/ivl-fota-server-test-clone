#SSL Instructions
This folder contains the public and private keys for the mf2fota-dev.2to8.cc domain.  

## PFX Password
Password: kitten123

## PFX Creation
Certificate was created on a Mac using the following command:
```
openssl pkcs12 -export -out mf2fota-dev.pfx -inkey privatekey.key -in mf2fota-dev_2to8_cc_cert.crt 
```

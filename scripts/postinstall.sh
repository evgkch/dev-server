#!/bin/bash

CERT_FOLDER=$1 

function gen_cert {
    openssl req \
        -newkey rsa:4096 \
        -new \
        -nodes \
        -x509 \
        -days 3650 \
        -subj "/C=RU/ST=Developer/L=Moscow/O=Dis/CN=localhost" \
        -keyout $1/key.pem \
        -out $1/cert.pem
}

mkdir -p $CERT_FOLDER
gen_cert $CERT_FOLDER

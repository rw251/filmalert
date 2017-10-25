#!/bin/bash
grunt dev
lftp -e "mirror -R /home/ubuntu/workspace/dist/public_html/ /public_html  && exit" -u $FTP_USER,$FTP_PASS $FTP_URL 
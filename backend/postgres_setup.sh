#!/bin/bash

sudo -u postgres psql -c "CREATE role teamendgame with createdb login encrypted password 'password';"
sudo -u postgres psql -c "CREATE DATABASE endgame OWNER teamendgame;"
sudo -u postgres psql -d "endgame" -f setup.sql -f sample.sql
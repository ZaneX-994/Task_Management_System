#!/bin/bash

psql -h localhost -U teamendgame -d "endgame" -c  "DROP table profiles;" -f setup.sql -f sample.sql
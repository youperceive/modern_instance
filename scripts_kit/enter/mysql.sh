#!/bin/bash

docker exec -it api-mysql-1 mysql -u root -p123456 -e "
use user_account_db;
select * from user;
"

CREATE DATABASE todo;

CREATE TABLE list (
  id SERIAL PRIMARY KEY,
  list_name TEXT,
  user_id TEXT
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT,
  email TEXT,
  password_digest TEXT
);

CREATE TABLE item (
  id SERIAL PRIMARY KEY,
  description TEXT,
  group_id TEXT,
  list_order TEXT
);

UPDATE list SET user_id = 5 WHERE id = 3;

UPDATE item SET group_id = 2 WHERE id between 1 and 2;


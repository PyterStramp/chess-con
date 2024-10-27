CREATE DATABASE chess_con; 

\c chess_con;

-- Tables

CREATE TABLE rol(
    id_rol INT PRIMARY KEY,
    name VARCHAR(125)
);

CREATE TABLE users(
	id SERIAL PRIMARY KEY,
    rol INT NOT NULL DEFAULT '1',
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    FOREIGN KEY (rol) REFERENCES rol(id_rol)
);

CREATE TABLE user_info(
	user_id INT PRIMARY KEY,
    user_rank TEXT CHECK (user_rank IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
    user_points INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE games(
	id SERIAL PRIMARY KEY,
    timer VARCHAR(2),
    moves TEXT NOT NULL,
    user_id_white INT NOT NULL,
    user_id_black INT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    winner INT,
    FOREIGN KEY(user_id_white) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id_black) REFERENCES users(id) ON DELETE CASCADE
);

--PROCEDURES

CREATE OR REPLACE FUNCTION createUser(
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR
) RETURNS VOID AS $$
DECLARE
    userId INT;
BEGIN

    INSERT INTO users (rol, username, email, password)
    VALUES (1, p_username, p_email, p_password)
    RETURNING id INTO userId;

    INSERT INTO user_info(user_id) VALUES (userId);

EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'El usuario con ese username o email ya existe';
END;
$$ LANGUAGE plpgsql;

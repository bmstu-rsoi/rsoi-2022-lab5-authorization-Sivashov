--drop table ticket cascade;
--drop table airport cascade;
--drop table flight cascade;
--drop table privilege cascade;
--drop table privilege_history cascade;

--CREATE ROLE program if not exists WITH PASSWORD 'test';
--ALTER ROLE program WITH LOGIN;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE ticket
(
    id            SERIAL PRIMARY KEY,
    ticket_uid    uuid NOT NULL,
    username      VARCHAR(80) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    price         INT         NOT NULL,
    status        VARCHAR(20) NOT NULL
        CHECK (status IN ('PAID', 'CANCELED'))
);
--GRANT ALL PRIVILEGES ON ticket TO program;
--grant USAGE, SELECT ON SEQUENCE ticket_id_seq TO program;


insert into ticket(id, ticket_uid, username, flight_number, price, status)
		values (1, '049161bb-badd-4fa8-9d90-87c9a82b0668', 'Test Max', 'AFL031', 1500, 'PAID');
		
SELECT * FROM Ticket where username = 'Test Max';


CREATE TABLE airport
(
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255),
    city    VARCHAR(255),
    country VARCHAR(255)
);

CREATE TABLE flight
(
    id              SERIAL PRIMARY KEY,
    flight_number   VARCHAR(20)              NOT NULL,
    datetime        TIMESTAMP WITH TIME ZONE NOT NULL,
    from_airport_id INT REFERENCES airport (id),
    to_airport_id   INT REFERENCES airport (id),
    price           INT                      NOT NULL
);

--GRANT ALL PRIVILEGES ON flight TO program;
--GRANT ALL PRIVILEGES ON airport TO program;
insert into airport (id, name, city, country) values (1, 'Шереметьево', 'Москва', 'Россия'),
													(2, 'Пулково', 'Санкт-Петербург', 'Россия');
insert into flight (id, flight_number, datetime, from_airport_id, to_airport_id, price)
		values (1, 'AFL031', '2021-10-08 20:00', 2, 1, 1500);
select * from airport;
select * from flight;


CREATE TABLE privilege
(
    id       SERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    status   VARCHAR(80) NOT NULL DEFAULT 'BRONZE'
        CHECK (status IN ('BRONZE', 'SILVER', 'GOLD')),
    balance  INT
);

CREATE TABLE privilege_history
(
    id             SERIAL PRIMARY KEY,
    privilege_id   INT REFERENCES privilege (id),
    ticket_uid     uuid        NOT NULL,
    datetime       TIMESTAMP   NOT NULL,
    balance_diff   INT         NOT NULL,
    operation_type VARCHAR(20) NOT NULL
        CHECK (operation_type IN ('FILL_IN_BALANCE', 'DEBIT_THE_ACCOUNT'))
);

--GRANT ALL PRIVILEGES ON privilege TO program;
--GRANT ALL PRIVILEGES ON privilege_history TO program;
--grant USAGE, SELECT ON SEQUENCE privilege_history_id_seq TO program;
--truncate privilege cascade;
--select * from privilege;
insert into privilege (id, username, status, balance) values (default, 'Test Max', 'SILVER', 1500)
on conflict (id) do update set id = excluded.id + 1;
--update privilege set balance = 1500 where username = 'Dima';
--truncate privilege_history;
insert into privilege_history (id, privilege_id, ticket_uid, datetime, balance_diff, operation_type)
values (1, 1, '049161bb-badd-4fa8-9d90-87c9a82b0668', '2021-10-08T19:59:19Z', 1500, 'FILL_IN_BALANCE');
select * from privilege;
select * from privilege_history;









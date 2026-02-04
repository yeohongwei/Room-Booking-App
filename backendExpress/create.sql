CREATE TABLE role (
	role VARCHAR(20) PRIMARY KEY
);



INSERT INTO role VALUES ('USER'),('ADMIN');

CREATE TABLE users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name varchar(50) NOT NULL,
    email varchar(100) NOT NULL,
    hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER TABLE users
-- ALTER COLUMN role DROP NOT NULL;


CREATE TABLE rooms (
	 id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	 name VARCHAR(50) NOT NULL,
	 capacity SMALLINT NOT NULL CHECK (capacity > 0),
	 location VARCHAR(200),
	 is_active BOOLEAN NOT NULL DEFAULT TRUE,
	 created_at TIMESTAMPTZ DEFAULT NOW()
 );
 
 
 CREATE TABLE equipments (
 	id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 	code VARCHAR(50) NOT NULL UNIQUE,
 	display_name VARCHAR(50) NOT NULL,
 	description TEXT
 );
 
 
 CREATE TABLE room_equipments (
 	room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 	equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
 	quantity SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
 	PRIMARY KEY (room_id, equipment_id)
 );
 
 
 CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject VARCHAR(200) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time)
);

DROP TABLE bookings;
DROP TABLE room_equipments;
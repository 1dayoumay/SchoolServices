-- Create events table
-- CREATE TABLE IF NOT EXISTS events (
--     id SERIAL PRIMARY KEY,
--     school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
--     title VARCHAR(255) NOT NULL,
--     description TEXT,
--     type VARCHAR(20) NOT NULL CHECK (type IN ('holiday', 'exam', 'meeting', 'celebration', 'maintenance', 'other')),
--     start_date DATE NOT NULL,
--     end_date DATE NOT NULL,
--     start_time TIME,
--     end_time TIME,
--     location VARCHAR(255),
--     affected_classes TEXT[] DEFAULT '{}',
--     affected_teachers TEXT[] DEFAULT '{}',
--     is_recurring BOOLEAN DEFAULT FALSE,
--     recurring_pattern VARCHAR(20) CHECK (recurring_pattern IN ('weekly', 'monthly', 'yearly')),
--     status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_school ON events(school_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

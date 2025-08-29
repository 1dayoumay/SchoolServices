-- Create teacher absences table
CREATE TABLE IF NOT EXISTS teacher_absences (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('request', 'immediate')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    response_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_absences_teacher ON teacher_absences(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_absences_status ON teacher_absences(status);
CREATE INDEX IF NOT EXISTS idx_teacher_absences_dates ON teacher_absences(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_teacher_absences_created ON teacher_absences(created_at);

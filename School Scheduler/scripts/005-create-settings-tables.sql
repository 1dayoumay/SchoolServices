-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '15:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, name)
);

-- Create classes table (if not exists)
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(10) NOT NULL,
    grade INTEGER NOT NULL,
    student_count INTEGER DEFAULT 0,
    shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, grade, name)
);

-- Create subjects table (if not exists)
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    weekly_hours INTEGER NOT NULL DEFAULT 1,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, name)
);

-- Create teachers table (if not exists)
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    max_hours INTEGER DEFAULT 40,
    unavailable_days JSONB DEFAULT '[]',
    temp_password VARCHAR(255),
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, email)
);

-- Create teacher_subject_assignments table
CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, teacher_id, subject_id, class_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_school_id ON shifts(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_shift_id ON classes(shift_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_school_id ON teacher_subject_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_subject_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject_id ON teacher_subject_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_subject_assignments(class_id);

-- Migrate existing data if columns exist with different names
DO $$
BEGIN
    -- Check if old column names exist and migrate data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'hours_per_week') THEN
        -- Update subjects table to use weekly_hours
        ALTER TABLE subjects ADD COLUMN IF NOT EXISTS weekly_hours INTEGER;
        UPDATE subjects SET weekly_hours = hours_per_week WHERE weekly_hours IS NULL;
        ALTER TABLE subjects ALTER COLUMN weekly_hours SET NOT NULL;
        ALTER TABLE subjects ALTER COLUMN weekly_hours SET DEFAULT 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'students_count') THEN
        -- Update classes table to use student_count
        ALTER TABLE classes ADD COLUMN IF NOT EXISTS student_count INTEGER;
        UPDATE classes SET student_count = students_count WHERE student_count IS NULL;
        ALTER TABLE classes ALTER COLUMN student_count SET DEFAULT 0;
    END IF;
END $$;

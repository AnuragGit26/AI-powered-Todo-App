CREATE TABLE public.activity_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity text NOT NULL,
    timestamp timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Security Hardening: Enable RLS and define policies for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own sessions
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'Users can select own sessions'
    ) THEN
        CREATE POLICY "Users can select own sessions"
        ON public.user_sessions
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Allow users to insert their own session rows
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'Users can insert own sessions'
    ) THEN
        CREATE POLICY "Users can insert own sessions"
        ON public.user_sessions
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Allow users to update only their own session rows
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'Users can update own sessions'
    ) THEN
        CREATE POLICY "Users can update own sessions"
        ON public.user_sessions
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Allow users to delete only their own session rows
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'Users can delete own sessions'
    ) THEN
        CREATE POLICY "Users can delete own sessions"
        ON public.user_sessions
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;
CREATE TABLE public.billing_invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    invoice_date date NOT NULL,
    amount numeric NOT NULL,
    status text NULL,
    pdf_url text NULL,
    created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT billing_invoices_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
CREATE TABLE public.payment_methods (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    card_last4 text NULL,
    card_brand text NULL,
    is_default boolean NULL DEFAULT false,
    created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
CREATE TABLE public.pomodoro_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    state jsonb NOT NULL,
    device_id text NOT NULL,
    updated_at timestamp with time zone NULL DEFAULT now(),
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT pomodoro_sessions_user_id_key UNIQUE (user_id),
    CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_updated_at ON public.pomodoro_sessions USING btree (updated_at) TABLESPACE pg_default;
CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    username text NOT NULL,
    phone_number text NULL,
    user_region text NULL,
    location text NULL,
    updated_at timestamp with time zone NULL,
    bio text NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
    CONSTRAINT profiles_username_key UNIQUE (username),
    CONSTRAINT profiles_username_unique UNIQUE (username),
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles USING btree (user_id) TABLESPACE pg_default;
CREATE TABLE public.subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    plan text NOT NULL,
    status text NOT NULL,
    limits jsonb NULL,
    created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
CREATE TABLE public.subtasks (
    id uuid NOT NULL,
    "parentId" uuid NOT NULL,
    title text NOT NULL,
    completed boolean NOT NULL,
    "createdAt" date NULL,
    "dueDate" date NULL,
    priority text NOT NULL,
    analysis jsonb NULL,
    status text NOT NULL,
    "completedAt" timestamp with time zone NULL,
    "estimatedTime" text NULL,
    CONSTRAINT subtasks_pkey PRIMARY KEY (id),
    CONSTRAINT subtasks_parentId_fkey FOREIGN KEY ("parentId") REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT subtasks_parentId_fkey1 FOREIGN KEY ("parentId") REFERENCES tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT subtasks_priority_check CHECK (
        (
            priority = ANY (ARRAY ['low'::text, 'medium'::text, 'high'::text])
        )
    ),
    CONSTRAINT subtasks_status_check CHECK (
        (
            status = ANY (
                ARRAY ['Not Started'::text, 'In progress'::text, 'Completed'::text]
            )
        )
    )
) TABLESPACE pg_default;
CREATE TABLE public.tasks (
    id uuid NOT NULL,
    title text NOT NULL,
    completed boolean NOT NULL,
    "createdAt" timestamp with time zone NULL,
    "dueDate" timestamp with time zone NULL,
    priority text NOT NULL,
    analysis jsonb NULL,
    status text NOT NULL,
    "userId" text NULL,
    "completedAt" timestamp with time zone NULL,
    "estimatedTime" text NULL,
    "lastRecurrenceDate" timestamp with time zone NULL,
    recurrence jsonb NULL,
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_priority_check CHECK (
        (
            priority = ANY (ARRAY ['low'::text, 'medium'::text, 'high'::text])
        )
    ),
    CONSTRAINT tasks_status_check CHECK (
        (
            status = ANY (
                ARRAY ['Not Started'::text, 'In progress'::text, 'Completed'::text]
            )
        )
    )
) TABLESPACE pg_default;
CREATE TABLE public.user_sessions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    user_agent text NULL,
    ip text NULL,
    device_type text NULL,
    location text NULL,
    is_current boolean NULL DEFAULT false,
    device_fingerprint text NULL,
    CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_device_fingerprint UNIQUE (user_id, device_fingerprint),
    CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;
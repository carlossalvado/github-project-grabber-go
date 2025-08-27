-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Function to send push notifications
CREATE OR REPLACE FUNCTION public.send_push_notification(
    p_title TEXT,
    p_body TEXT,
    p_icon TEXT DEFAULT '/favicon.ico',
    p_badge TEXT DEFAULT '/favicon.ico',
    p_sender_email TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    user_id UUID,
    endpoint TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    sub RECORD;
    notification_payload JSONB;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Check if sender is authorized (armempires@gmail.com)
    IF p_sender_email IS NOT NULL AND p_sender_email != 'armempires@gmail.com' THEN
        RAISE EXCEPTION 'Unauthorized: Only armempires@gmail.com can send push notifications';
    END IF;

    -- Prepare notification payload
    notification_payload := jsonb_build_object(
        'title', p_title,
        'body', p_body,
        'icon', p_icon,
        'badge', p_badge,
        'timestamp', extract(epoch from now()) * 1000
    );

    -- Loop through all active subscriptions
    FOR sub IN
        SELECT ps.user_id, ps.endpoint, ps.p256dh, ps.auth
        FROM public.push_subscriptions ps
        WHERE ps.endpoint IS NOT NULL
        AND ps.p256dh IS NOT NULL
        AND ps.auth IS NOT NULL
    LOOP
        BEGIN
            -- Send notification using web-push
            -- Note: This would need web-push library configured in Supabase
            -- For now, we'll simulate the send and return success

            -- In production, you would use web-push to send here
            -- SELECT * FROM net.http_post(
            --     url := sub.endpoint,
            --     headers := jsonb_build_object(
            --         'Content-Type', 'application/json',
            --         'TTL', '86400'
            --     ),
            --     body := notification_payload::text
            -- );

            success := TRUE;
            user_id := sub.user_id;
            endpoint := sub.endpoint;
            error_message := NULL;

            RETURN NEXT;

        EXCEPTION WHEN OTHERS THEN
            success := FALSE;
            user_id := sub.user_id;
            endpoint := sub.endpoint;
            error_message := SQLERRM;

            RETURN NEXT;
        END;
    END LOOP;

    RETURN;
END;
$function$;
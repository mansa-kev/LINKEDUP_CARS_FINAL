-- Email Confirmation Trigger for Welcome Email
-- This trigger sends a welcome email after a user confirms their email

-- First, create a function to send the welcome email
CREATE OR REPLACE FUNCTION send_welcome_email_after_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  app_url TEXT;
  login_url TEXT;
  profile_name TEXT;
BEGIN
  -- Only send if email confirmation just happened
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    BEGIN
      SELECT full_name INTO profile_name
      FROM public.user_profiles
      WHERE id = NEW.id;

      app_url := 'https://app.linkedupcarsrentals.com/login';
      login_url := app_url;

      INSERT INTO public.notification_queue (
        channel,
        recipient,
        content,
        status,
        attempts,
        created_at
      ) VALUES (
        'email',
        NEW.email,
        jsonb_build_object(
          'template', 'welcome_after_confirmation',
          'data', jsonb_build_object(
            'name', COALESCE(profile_name, 'Valued Customer'),
            'login_url', login_url
          )
        ),
        'queued',
        0,
        NOW()
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Never block email confirmation even if welcome email queueing fails.
        NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION send_welcome_email_after_confirmation();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

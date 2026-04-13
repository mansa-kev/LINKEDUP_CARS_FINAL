-- Email Confirmation Trigger for Welcome Email
-- This trigger sends a welcome email after a user confirms their email

-- First, create a function to send the welcome email
CREATE OR REPLACE FUNCTION send_welcome_email_after_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  app_url TEXT;
  login_url TEXT;
BEGIN
  -- Only send if email confirmation just happened
  -- Check if user was created but not confirmed, and now is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Get the user's profile name
    DECLARE
      profile_name TEXT;
    BEGIN
      SELECT full_name INTO profile_name
      FROM user_profiles
      WHERE id = NEW.id;
      
      -- Set login URL based on environment
      app_url := 'https://app.linkedupcarsrentals.com/login';
      login_url := app_url;
      
      -- Send welcome email via notification queue (processed by edge function)
      INSERT INTO notification_queue (
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

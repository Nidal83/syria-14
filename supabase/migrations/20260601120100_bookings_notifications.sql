-- ─────────────────────────────────────────────────────────────────
-- Bookings notifications wiring  (file 2 of 2)
--
-- Apply AFTER 20260601120000_bookings_schema.sql.
--
-- The `notifications` table from the office subsystem
-- (20260517000000_office_system.sql) IS present, so booking lifecycle
-- events emit notifications.
--
-- Why a separate file: `ALTER TYPE ... ADD VALUE` adds an enum value
-- that cannot be USED in the same transaction it was added in, and the
-- Supabase CLI wraps each migration file in one transaction. Keeping the
-- ADD VALUE statements in their own migration guarantees they are
-- committed before the lifecycle triggers (which reference the new
-- values at runtime) ever fire.
-- ─────────────────────────────────────────────────────────────────

-- Extend notification_type with the booking lifecycle kinds.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_cancelled';

-- Trigger: new pending booking → notify the office owner.
CREATE OR REPLACE FUNCTION public.fn_notify_office_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office_owner uuid;
  v_property_title text;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;

  SELECT o.owner_id, p.title
    INTO v_office_owner, v_property_title
    FROM public.properties p
    JOIN public.offices o ON o.id = p.office_id
   WHERE p.id = NEW.property_id;

  IF v_office_owner IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (
    v_office_owner,
    'booking_request',
    'New booking request',
    'A booking request was made for ' || COALESCE(v_property_title, 'your property'),
    '/office/bookings/' || NEW.id::text,
    jsonb_build_object('booking_id', NEW.id, 'property_id', NEW.property_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_office_on_new_booking ON public.bookings;
CREATE TRIGGER trg_notify_office_on_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_office_on_new_booking();

-- Trigger: status change → notify the other side.
CREATE OR REPLACE FUNCTION public.fn_notify_on_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office_owner uuid;
  v_user uuid := NEW.user_id;
  v_notify_user uuid;
  v_type notification_type;
  v_title text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT o.owner_id INTO v_office_owner
    FROM public.properties p JOIN public.offices o ON o.id = p.office_id
    WHERE p.id = NEW.property_id;

  -- Pick the right recipient + notification kind
  IF NEW.status = 'confirmed' THEN
    v_notify_user := v_user;
    v_type := 'booking_confirmed';
    v_title := 'Your booking is confirmed';
  ELSIF NEW.status = 'rejected' THEN
    v_notify_user := v_user;
    v_type := 'booking_rejected';
    v_title := 'Your booking was declined';
  ELSIF NEW.status = 'cancelled' THEN
    -- User cancelled → notify office. Office cancelled → notify user.
    IF OLD.status IN ('pending', 'confirmed') THEN
      v_notify_user := v_office_owner;
      v_type := 'booking_cancelled';
      v_title := 'A booking was cancelled';
    END IF;
  ELSE
    RETURN NEW; -- completed, etc. — no notification for now
  END IF;

  IF v_notify_user IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, data)
  VALUES (
    v_notify_user,
    v_type,
    v_title,
    'For booking ' || NEW.id::text,
    '/bookings/' || NEW.id::text,
    jsonb_build_object('booking_id', NEW.id, 'property_id', NEW.property_id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_booking_status_change ON public.bookings;
CREATE TRIGGER trg_notify_on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_on_booking_status_change();

-- 1. Fix existing bad notification links
UPDATE public.notifications
SET link = '/control-panel/properties'
WHERE link LIKE '/admin/properties/%';

-- 2. Replace the property-publish trigger with corrected link
CREATE OR REPLACE FUNCTION public.fn_notify_admins_on_property_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_office_name text;
  v_admin       record;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT office_name INTO v_office_name
    FROM public.offices
   WHERE id = NEW.office_id;

  FOR v_admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.user_role
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      v_admin.user_id,
      'property_published',
      'عقار جديد منشور',
      COALESCE(v_office_name, 'مكتب') || ': ' || COALESCE(NEW.title, '(بدون عنوان)'),
      '/control-panel/properties',
      jsonb_build_object(
        'property_id', NEW.id,
        'office_id',   NEW.office_id,
        'title',       NEW.title
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- 3. Notify office applicant when their application is decided
CREATE OR REPLACE FUNCTION public.fn_notify_office_on_application_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.user_id,
      'office_approved',
      'تمت الموافقة على طلبك',
      'تهانينا! تمت الموافقة على طلب تسجيل مكتبك. يمكنك الآن الوصول إلى لوحة تحكم المكتب.',
      '/office/dashboard',
      jsonb_build_object('application_id', NEW.id, 'office_name', NEW.office_name)
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.user_id,
      'office_rejected',
      'لم تتم الموافقة على طلبك',
      CASE
        WHEN NEW.rejection_reason IS NOT NULL AND trim(NEW.rejection_reason) <> ''
        THEN 'للأسف لم تتم الموافقة على طلبك. السبب: ' || NEW.rejection_reason
        ELSE 'للأسف لم تتم الموافقة على طلب تسجيل مكتبك.'
      END,
      '/office/application-status',
      jsonb_build_object('application_id', NEW.id, 'office_name', NEW.office_name)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_office_on_application_decision
  AFTER UPDATE ON public.office_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_office_on_application_decision();

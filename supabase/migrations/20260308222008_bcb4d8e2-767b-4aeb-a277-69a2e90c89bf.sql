
-- Create enums
CREATE TYPE public.user_role AS ENUM ('user', 'office', 'admin');
CREATE TYPE public.office_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.listing_type AS ENUM ('rent', 'sale');

-- Governorates
CREATE TABLE public.governorates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL
);

-- Areas
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  governorate_id UUID NOT NULL REFERENCES public.governorates(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL
);

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Offices
CREATE TABLE public.offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  governorate_id UUID REFERENCES public.governorates(id),
  area_id UUID REFERENCES public.areas(id),
  status office_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  listing_type listing_type NOT NULL DEFAULT 'sale',
  property_type TEXT NOT NULL DEFAULT '',
  governorate_id UUID REFERENCES public.governorates(id),
  area_id UUID REFERENCES public.areas(id),
  address TEXT NOT NULL DEFAULT '',
  rooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  floor INTEGER NOT NULL DEFAULT 0,
  area_size NUMERIC NOT NULL DEFAULT 0,
  furnished BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL DEFAULT '',
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property images
CREATE TABLE public.property_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT false
);

-- Favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  UNIQUE(user_id, property_id)
);

-- Inquiries
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- Governorates & areas: public read
CREATE POLICY "Anyone can read governorates" ON public.governorates FOR SELECT USING (true);
CREATE POLICY "Anyone can read areas" ON public.areas FOR SELECT USING (true);

-- Profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Offices: public read, owner can update
CREATE POLICY "Anyone can read approved offices" ON public.offices FOR SELECT USING (status = 'approved');
CREATE POLICY "Owner can read own office" ON public.offices FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner can insert office" ON public.offices FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner can update own office" ON public.offices FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins can manage offices" ON public.offices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Properties: public read active
CREATE POLICY "Anyone can read active properties" ON public.properties FOR SELECT USING (status = 'active');
CREATE POLICY "Office can manage own properties" ON public.properties FOR ALL TO authenticated USING (
  office_id IN (SELECT id FROM public.offices WHERE owner_id = auth.uid())
);
CREATE POLICY "Admins can manage all properties" ON public.properties FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Property images: public read
CREATE POLICY "Anyone can read property images" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Office can manage own property images" ON public.property_images FOR ALL TO authenticated USING (
  property_id IN (SELECT id FROM public.properties WHERE office_id IN (SELECT id FROM public.offices WHERE owner_id = auth.uid()))
);

-- Favorites
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Inquiries
CREATE POLICY "Users can insert own inquiries" ON public.inquiries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read own inquiries" ON public.inquiries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Office can read inquiries for their properties" ON public.inquiries FOR SELECT TO authenticated USING (
  property_id IN (SELECT id FROM public.properties WHERE office_id IN (SELECT id FROM public.offices WHERE owner_id = auth.uid()))
);
CREATE POLICY "Admins can read all inquiries" ON public.inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

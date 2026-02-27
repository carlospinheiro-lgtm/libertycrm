
-- Sequence for property references
CREATE SEQUENCE IF NOT EXISTS property_reference_seq START 1;

-- Main properties table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  lead_id uuid REFERENCES public.leads(id),
  reference text UNIQUE NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  assigned_agent uuid REFERENCES public.profiles(id),
  property_type text NOT NULL DEFAULT 'apartamento',
  address text,
  parish text,
  city text DEFAULT 'Braga',
  area_m2 numeric,
  rooms integer,
  bedrooms integer,
  bathrooms integer,
  floor text,
  garage boolean DEFAULT false,
  energy_certificate text,
  asking_price numeric NOT NULL DEFAULT 0,
  minimum_price numeric,
  contract_type text NOT NULL DEFAULT 'exclusive',
  contract_start_date date,
  contract_end_date date,
  contract_duration_months integer DEFAULT 6,
  commission_percentage numeric,
  current_stage text NOT NULL DEFAULT 'documentos',
  stage_entered_at timestamptz DEFAULT now(),
  cover_photo_url text,
  video_url text,
  virtual_tour_url text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_properties_agency ON public.properties(agency_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_stage ON public.properties(current_stage);
CREATE INDEX idx_properties_lead ON public.properties(lead_id);

CREATE POLICY "Users can view properties from their agency" ON public.properties FOR SELECT USING (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Users can create properties in their agency" ON public.properties FOR INSERT WITH CHECK (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Users can update properties in their agency" ON public.properties FOR UPDATE USING (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Users can delete properties in their agency" ON public.properties FOR DELETE USING (has_agency_access(auth.uid(), agency_id));

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Property photos
CREATE TABLE public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  order_index integer DEFAULT 0,
  is_cover boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_property_photos_property ON public.property_photos(property_id);

CREATE POLICY "Users can view property photos" ON public.property_photos FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can manage property photos" ON public.property_photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can update property photos" ON public.property_photos FOR UPDATE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can delete property photos" ON public.property_photos FOR DELETE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));

-- Property checklist items
CREATE TABLE public.property_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  stage text NOT NULL,
  item_key text NOT NULL,
  label text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.profiles(id),
  is_optional boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_property_checklist_property ON public.property_checklist_items(property_id);
CREATE INDEX idx_property_checklist_stage ON public.property_checklist_items(stage);

CREATE POLICY "Users can view property checklist" ON public.property_checklist_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can create checklist items" ON public.property_checklist_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can update checklist items" ON public.property_checklist_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can delete checklist items" ON public.property_checklist_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));

-- Property visits
CREATE TABLE public.property_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  visit_date timestamptz NOT NULL,
  buyer_name text,
  buyer_contact text,
  agent_id uuid REFERENCES public.profiles(id),
  outcome text DEFAULT 'medium_interest',
  feedback text,
  follow_up_created boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_property_visits_property ON public.property_visits(property_id);

CREATE POLICY "Users can view property visits" ON public.property_visits FOR SELECT USING (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Users can create property visits" ON public.property_visits FOR INSERT WITH CHECK (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Users can update property visits" ON public.property_visits FOR UPDATE USING (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Users can delete property visits" ON public.property_visits FOR DELETE USING (has_agency_access(auth.uid(), agency_id));

-- Property portals
CREATE TABLE public.property_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  portal_name text NOT NULL,
  is_published boolean DEFAULT false,
  portal_url text,
  publish_date date,
  last_updated timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_portals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_property_portals_property ON public.property_portals(property_id);

CREATE POLICY "Users can view property portals" ON public.property_portals FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can manage property portals" ON public.property_portals FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can update property portals" ON public.property_portals FOR UPDATE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can delete property portals" ON public.property_portals FOR DELETE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));

-- Property documents
CREATE TABLE public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  expiry_date date,
  version integer DEFAULT 1,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_property_documents_property ON public.property_documents(property_id);

CREATE POLICY "Users can view property documents" ON public.property_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can upload property documents" ON public.property_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can update property documents" ON public.property_documents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));
CREATE POLICY "Users can delete property documents" ON public.property_documents FOR DELETE USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND has_agency_access(auth.uid(), p.agency_id)));

-- Property activities (timeline)
CREATE TABLE public.property_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  activity_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.property_activities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_property_activities_property ON public.property_activities(property_id);

CREATE POLICY "Users can view property activities" ON public.property_activities FOR SELECT USING (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Users can create property activities" ON public.property_activities FOR INSERT WITH CHECK (has_agency_access(auth.uid(), agency_id));
CREATE POLICY "Property activities are immutable" ON public.property_activities FOR UPDATE USING (false);
CREATE POLICY "Property activities cannot be deleted" ON public.property_activities FOR DELETE USING (false);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false);

-- Storage policies for property-photos (public read, authenticated write)
CREATE POLICY "Property photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');
CREATE POLICY "Authenticated users can upload property photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update property photos" ON storage.objects FOR UPDATE USING (bucket_id = 'property-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete property photos" ON storage.objects FOR DELETE USING (bucket_id = 'property-photos' AND auth.role() = 'authenticated');

-- Storage policies for property-documents (authenticated only)
CREATE POLICY "Authenticated users can view property documents" ON storage.objects FOR SELECT USING (bucket_id = 'property-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload property documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update property documents" ON storage.objects FOR UPDATE USING (bucket_id = 'property-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete property documents" ON storage.objects FOR DELETE USING (bucket_id = 'property-documents' AND auth.role() = 'authenticated');

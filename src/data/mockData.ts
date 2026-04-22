import type { PageSeo } from "@/lib/api";

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface ServiceCard {
  icon: string;
  /** Optional uploaded icon (Strapi Media); when set, UI prefers this over Lucide `icon`. */
  iconImage?: string;
  title: string;
  description: string;
  href: string;
  category: string;
  /** Card thumbnail from Strapi (cardImage / heroImage). */
  cardImage?: string;
}

export interface ServiceDetail {
  slug: string;
  icon: string;
  iconImage?: string;
  title: string;
  category: string;
  heroImage: string;
  description: string;
  benefits: string[];
  tests: string[];
  pricing: { item: string; price: string; duration: string }[];
  timeline: { step: number; title: string; description: string }[];
  documents: { name: string; required: boolean }[];
  relatedSlugs: string[];
  /** When using Strapi, populated from `seo` component. */
  seo?: PageSeo;
}

export interface StatItem {
  label: string;
  value: number;
  suffix: string;
}

export interface Testimonial {
  name: string;
  photo: string;
  rating: number;
  quote: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ComparisonRow {
  feature: string;
  physical: boolean | string;
  radiology: boolean | string;
  laboratory: boolean | string;
  vaccination: boolean | string;
}

export interface EquipmentItem {
  slNo: string;
  name: string;
  model: string;
  qty: string;
  origin?: string;
  status?: string;
  image?: string;
}

export interface FitnessCriteria {
  category: string;
  description: string;
  items: string[];
}

export interface ServicePackage {
  title: string;
  description: string;
  features: string[];
  pricing: string;
}

// Navigation — per reference doc (added Report Search, Equipment, Fitness Criteria)
export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  {
    label: "Resources",
    href: "#",
    children: [
      { label: "Fitness Criteria", href: "/fitness" },
      { label: "Equipment", href: "/equipment" },
    ],
  },
  { label: "News", href: "/news" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

// 4 services per reference doc (not 6)
export const serviceCategories = ["All", "Examination", "Imaging", "Laboratory", "Preventive"];

export const services: ServiceCard[] = [
  {
    icon: "Stethoscope",
    title: "Physical Examination",
    description: "Complete medical examination including visual acuity, system examination, and mental status assessment for GCC requirements.",
    href: "/services/physical-examination",
    category: "Examination",
    cardImage: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&h=500&fit=crop",
  },
  {
    icon: "ScanLine",
    title: "Digital Radiology",
    description: "Advanced digital chest X-ray using DRGEM GXR-40S system from Korea with radiation protection and quality imaging.",
    href: "/services/digital-radiology",
    category: "Imaging",
    cardImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=500&fit=crop",
  },
  {
    icon: "TestTubes",
    title: "Laboratory Tests",
    description: "Comprehensive lab testing including biochemistry, immunology, hematology, serology, and clinical pathology.",
    href: "/services/laboratory-tests",
    category: "Laboratory",
    cardImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=500&fit=crop",
  },
  {
    icon: "Syringe",
    title: "Vaccination",
    description: "Required vaccinations for overseas employment including MMR (Dose 1 & 2) and Meningococcal vaccines.",
    href: "/services/vaccination",
    category: "Preventive",
    cardImage: "https://images.unsplash.com/photo-1584308666744-24d5c474e870?w=800&h=500&fit=crop",
  },
];

export const serviceDetails: Record<string, ServiceDetail> = {
  "physical-examination": {
    slug: "physical-examination",
    icon: "Stethoscope",
    title: "Physical Examination",
    category: "Examination",
    heroImage: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&h=500&fit=crop",
    description: "Our Physical Examination service provides a thorough medical assessment meeting all GCC country requirements. Conducted by qualified medical officers, it covers general medical examination, vision testing, system examinations, and mental status evaluation.",
    benefits: [
      "Complete general medical examination by certified physicians",
      "Visual acuity testing — aided and unaided (colour vision, distant, near, hearing)",
      "System examination — gastrointestinal, genitourinary, musculoskeletal",
      "Mental status examination — appearance and cognition assessment",
      "GAMCA-approved reporting format",
      "Separate male and female examination facilities",
    ],
    tests: [
      "Medical Examination: General",
      "Visual Acuity — Aided and Unaided (Colour Vision, Distant, Near, Hearing)",
      "System Examination — Gastrointestinal, Genitourinary, Musculoskeletal",
      "Mental Status Examination — Appearance, Cognition",
    ],
    pricing: [
      { item: "Standard Physical Examination", price: "Call for Pricing", duration: "1–2 hours" },
      { item: "Express Examination", price: "Call for Pricing", duration: "45 min–1 hour" },
    ],
    timeline: [
      { step: 1, title: "Registration", description: "Present documents at reception and complete registration." },
      { step: 2, title: "Vision & Hearing Test", description: "Visual acuity and hearing assessment by trained technician." },
      { step: 3, title: "Physical Examination", description: "Comprehensive examination by medical officer (male/female)." },
      { step: 4, title: "Mental Status Check", description: "Cognitive and appearance evaluation." },
      { step: 5, title: "Report", description: "Findings documented in your medical file." },
    ],
    documents: [
      { name: "Valid Passport (Original + Copy)", required: true },
      { name: "2 Passport-size Photos", required: true },
      { name: "GAMCA Slip / Token Number", required: true },
      { name: "Previous Medical Reports (if any)", required: false },
    ],
    relatedSlugs: ["digital-radiology", "laboratory-tests", "vaccination"],
  },
  "digital-radiology": {
    slug: "digital-radiology",
    icon: "ScanLine",
    title: "Digital Radiology",
    category: "Imaging",
    heroImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&h=500&fit=crop",
    description: "Our Digital Radiology department features the DRGEM GXR-40S digital X-ray system from Korea, providing high-quality chest X-ray imaging with minimal radiation exposure and a complete radiation protection system.",
    benefits: [
      "Digital X-ray with DR Machine (DRGEM-KOREA) 500mm",
      "Minimal radiation exposure with protection system",
      "High-resolution digital imaging for accurate diagnosis",
      "Same-day report delivery",
      "Quality X-ray film and auto processor",
      "Certified radiologist review",
    ],
    tests: [
      "Chest X-ray (PA View)",
    ],
    pricing: [
      { item: "Chest X-ray", price: "Call for Pricing", duration: "30 minutes" },
    ],
    timeline: [
      { step: 1, title: "Registration", description: "Check in with your medical file at radiology." },
      { step: 2, title: "Preparation", description: "Change into gown, remove metal objects." },
      { step: 3, title: "Imaging", description: "Chest X-ray performed by certified radiographer." },
      { step: 4, title: "Report", description: "Radiologist reviews images and issues report." },
    ],
    documents: [
      { name: "Valid Passport or National ID", required: true },
      { name: "GAMCA Slip", required: true },
    ],
    relatedSlugs: ["physical-examination", "laboratory-tests", "vaccination"],
  },
  "laboratory-tests": {
    slug: "laboratory-tests",
    icon: "TestTubes",
    title: "Laboratory Tests",
    category: "Laboratory",
    heroImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&h=500&fit=crop",
    description: "Our state-of-the-art laboratory performs comprehensive testing across biochemistry, immunology, hematology, serology, and clinical pathology using automated analyzers for maximum accuracy and rapid turnaround.",
    benefits: [
      "Automated analyzers — Dimension EXL (Biochemistry), Sysmex XN-550 (Hematology)",
      "ELISA full set — Evolis Twin Plus by BIO-RAD (Immunology)",
      "Daily QC/Calibration for consistent, reliable results",
      "Barcode-based sample tracking system",
      "Results within 24 hours",
      "Bio Safety Cabinet Class II for safe sample handling",
    ],
    tests: [
      "Biochemistry — R.B.S, L.F.T, Creatinine",
      "Immunology",
      "Hematology",
      "Serology — HIV I & II, HBs Ag, Anti HCV, VDRL, TPHA (if VDRL positive), Pregnancy Test",
      "Clinical Pathology — Urine (Sugar, Albumin)",
      "Clinical Pathology — Stool (Routine: Helminthes, OVA, CYST, Others)",
    ],
    pricing: [
      { item: "Standard Lab Panel", price: "Call for Pricing", duration: "24 hours" },
      { item: "Full GCC Screening Panel", price: "Call for Pricing", duration: "24 hours" },
    ],
    timeline: [
      { step: 1, title: "Fasting Check", description: "Confirm 8–12 hour fasting for accurate blood results." },
      { step: 2, title: "Sample Collection", description: "Blood, urine, and stool samples collected." },
      { step: 3, title: "Lab Processing", description: "Samples analyzed using automated equipment." },
      { step: 4, title: "Result Delivery", description: "Reports available within 24 hours." },
    ],
    documents: [
      { name: "Valid Passport or NID", required: true },
      { name: "GAMCA Slip", required: true },
      { name: "Previous Lab Reports (if any)", required: false },
    ],
    relatedSlugs: ["physical-examination", "digital-radiology", "vaccination"],
  },
  "vaccination": {
    slug: "vaccination",
    icon: "Syringe",
    title: "Vaccination",
    category: "Preventive",
    heroImage: "https://images.unsplash.com/photo-1615631648086-325025c9e51e?w=1200&h=500&fit=crop",
    description: "We provide all required vaccinations for overseas employment including MMR (Measles, Mumps, Rubella) in two doses and Meningococcal vaccination. All vaccines are WHO-approved and administered by trained nursing staff.",
    benefits: [
      "WHO-approved vaccines only",
      "MMR Dose 1 & Dose 2",
      "Meningococcal vaccination",
      "Digital vaccination record maintained",
      "Administered by trained nursing staff",
      "Post-vaccination observation period",
    ],
    tests: [
      "MMR 1 (Measles, Mumps, Rubella — Dose 1)",
      "MMR 2 (Measles, Mumps, Rubella — Dose 2)",
      "Meningococcal Vaccine",
    ],
    pricing: [
      { item: "MMR Vaccine (per dose)", price: "Call for Pricing", duration: "15 minutes" },
      { item: "Meningococcal Vaccine", price: "Call for Pricing", duration: "15 minutes" },
      { item: "Complete Vaccination Package", price: "Call for Pricing", duration: "1 visit" },
    ],
    timeline: [
      { step: 1, title: "Consultation", description: "Nurse reviews travel requirements and medical history." },
      { step: 2, title: "Vaccination", description: "Vaccine administered by trained nursing staff." },
      { step: 3, title: "Observation", description: "15-minute post-vaccine observation period." },
      { step: 4, title: "Documentation", description: "Vaccination card and digital record issued." },
    ],
    documents: [
      { name: "Valid Passport", required: true },
      { name: "Previous Vaccination Records (if any)", required: false },
    ],
    relatedSlugs: ["physical-examination", "laboratory-tests", "digital-radiology"],
  },
};

// Comparison table — updated for 4 services
export const comparisonData: ComparisonRow[] = [
  { feature: "General Medical Exam", physical: true, radiology: false, laboratory: false, vaccination: false },
  { feature: "Visual Acuity & Hearing", physical: true, radiology: false, laboratory: false, vaccination: false },
  { feature: "System Examination", physical: true, radiology: false, laboratory: false, vaccination: false },
  { feature: "Chest X-ray", physical: false, radiology: true, laboratory: false, vaccination: false },
  { feature: "Blood Tests (CBC, Biochemistry)", physical: false, radiology: false, laboratory: true, vaccination: false },
  { feature: "Serology (HIV, HBs Ag, HCV, VDRL)", physical: false, radiology: false, laboratory: true, vaccination: false },
  { feature: "Urine & Stool Analysis", physical: false, radiology: false, laboratory: true, vaccination: false },
  { feature: "MMR & Meningococcal", physical: false, radiology: false, laboratory: false, vaccination: true },
  { feature: "Report Turnaround", physical: "Same day", radiology: "Same day", laboratory: "24 hours", vaccination: "Immediate" },
];

// Stats — per reference doc (NO Trusted Clients)
export const stats: StatItem[] = [
  { label: "Accuracy Rate", value: 100, suffix: "%" },
  { label: "Report Delivery", value: 24, suffix: "h" },
];

/** FAQs for the home page (matches Strapi seed `page=home`). */
export const homeFAQs: FAQItem[] = [
  {
    question: "What documents should I bring?",
    answer:
      "Valid passport, photos, and your GAMCA slip. Additional documents may apply by country.",
  },
  {
    question: "How long does reporting take?",
    answer: "Most results are available within 24–48 hours depending on the test panel.",
  },
  {
    question: "Do you offer same-day appointments?",
    answer: "Subject to slot availability. Please call or book online for the next opening.",
  },
];

// FAQ updated for actual services
export const serviceFAQs: FAQItem[] = [
  {
    question: "What documents do I need for a GCC medical checkup?",
    answer: "You will need your valid passport (original and copy), 2 passport-size photos, and your GAMCA slip or token number. If you have previous medical reports, please bring those as well.",
  },
  {
    question: "How long does the complete medical screening take?",
    answer: "The complete screening including physical examination, radiology, lab tests, and vaccination typically takes 2–3 hours. Reports are delivered within 24 hours.",
  },
  {
    question: "Do I need to fast before the medical checkup?",
    answer: "Yes, we recommend 8–12 hours of fasting before your appointment for accurate blood test results. You may drink water during the fasting period.",
  },
  {
    question: "What lab tests are included in the screening?",
    answer: "Our lab panel includes Biochemistry (R.B.S, L.F.T, Creatinine), Immunology, Hematology, Serology (HIV I&II, HBs Ag, Anti HCV, VDRL, TPHA if VDRL positive, Pregnancy), and Clinical Pathology (Urine and Stool analysis).",
  },
  {
    question: "Which vaccinations are required for GCC countries?",
    answer: "MMR (Measles, Mumps, Rubella) in two doses and Meningococcal vaccination are required. Our team will advise on the specific requirements for your destination country.",
  },
  {
    question: "Is your center approved by GAMCA?",
    answer: "Yes, Unicare Medical is fully approved by GAMCA (GCC Approved Medical Centers Association) and all GCC health ministries including Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, and Oman.",
  },
  {
    question: "Can I check my report online?",
    answer: "Yes, you can check your medical report status online through our Report Search portal accessible from the navigation menu. You'll need your Patient ID and registered phone number.",
  },
];

// Testimonials
export const testimonials: Testimonial[] = [
  {
    name: "Mohammad Rahman",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    quote: "Unicare Medical made my GCC medical process incredibly smooth. The staff was professional and I received my report within 24 hours.",
  },
  {
    name: "Fatima Akter",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    quote: "Very clean facility with modern equipment. The doctors were thorough and explained everything clearly. Highly recommended.",
  },
  {
    name: "Abdul Karim",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    quote: "I've been coming here for 3 years for my annual medical. Consistent quality and friendly staff every single time.",
  },
  {
    name: "Nusrat Jahan",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 4,
    quote: "Fast service and very organized. The online report checking system is very convenient. Great experience overall.",
  },
];

// Service Packages — per reference doc
export const servicePackages: ServicePackage[] = [
  {
    title: "Overseas Employment Medical Package",
    description: "Comprehensive health check-up for overseas job candidates.",
    features: ["Physical Examination", "Chest X-ray", "Full Lab Panel", "Vaccination", "GAMCA Report"],
    pricing: "Call for Pricing",
  },
  {
    title: "Express 24-Hour Reporting Package",
    description: "Fast-track medical report generation within 24 hours.",
    features: ["Priority Processing", "Same-day Lab Results", "Express Report Delivery", "Dedicated Queue"],
    pricing: "Call for Pricing",
  },
  {
    title: "Corporate/Agency Bulk Medical Package",
    description: "Specialized packages for recruiting agencies and bulk screenings.",
    features: ["Bulk Discount Rates", "Dedicated Coordinator", "Group Scheduling", "Agency Dashboard"],
    pricing: "Call for Pricing",
  },
];

// Equipment list — per reference doc
export const equipmentList: EquipmentItem[] = [
  { slNo: "01", name: "Digital X-ray with DR Machine (DRGEM-KOREA) 500mm, Auto Processor, Quality X-ray Film, Radiation Protection System", model: "Unit Model-GXR-40S", qty: "1 Set", origin: "Korea", status: "OPERATIONAL" },
  { slNo: "02", name: "Biochemistry Analyzer (Auto)", model: "Dimension EXL", qty: "1 Set", origin: "USA", status: "OPERATIONAL" },
  { slNo: "03", name: "Hematology Machine (Mythic)", model: "Brand: Orphee, Model: Mythic-18", qty: "1 Set", origin: "Japan", status: "OPERATIONAL" },
  { slNo: "04", name: "Immunology ELISA Full Set (Reader, Washer & Shaker)", model: "Evolis Twin Plus (BIO-RAD)", qty: "1 Set", origin: "France", status: "OPERATIONAL" },
  { slNo: "05", name: "Semi Auto Urine Chemistry Analyzer", model: "Docureader 2", qty: "1 Set" },
  { slNo: "06", name: "Bio Safety Cabinet (Class-II Type A-2)", model: "Biobase BSC-1300 IIA2X", qty: "1 Set" },
  { slNo: "07", name: "Roller Mixer", model: "Bio Max", qty: "1 pcs" },
  { slNo: "08", name: "Lab Rotator", model: "LRD-750N", qty: "1 pcs" },
  { slNo: "09", name: "Table Top Centrifuge Machine", model: "Eppendorf-5702", qty: "2 pcs" },
  { slNo: "10", name: "Binocular Microscope", model: "Olympus", qty: "2 pcs" },
  { slNo: "11", name: "Micropipette & Ancillary Instrument", model: "100–1000µ, 20–200µ, 10–100µ, 5–50µ", qty: "4 pcs" },
  { slNo: "12", name: "Refrigerator", model: "Singer Super Ariston", qty: "2 pcs" },
  { slNo: "13", name: "Hot Air Oven", model: "Digisystem DSO-500D", qty: "1 pcs" },
  { slNo: "14", name: "Lab Incubator", model: "DSI-500D", qty: "1 pcs" },
  { slNo: "15", name: "Computer", model: "—", qty: "12 Set" },
  { slNo: "16", name: "IT Server", model: "—", qty: "1 Set" },
  { slNo: "17", name: "Barcode Printer", model: "Zebra ZD230d", qty: "2 pcs" },
  { slNo: "18", name: "Ledger Printer", model: "HP Laser MPF 1535a", qty: "2 pcs" },
  { slNo: "19", name: "Finger Print Detector", model: "ZKTeco", qty: "6 pcs" },
  { slNo: "20", name: "Patient Bed", model: "—", qty: "2 pcs" },
];

// Fitness criteria — per reference doc
export const fitnessCriteria: FitnessCriteria[] = [
  {
    category: "Infectious Diseases — Must Be Negative / Non-Reactive",
    description: "Candidates must test negative for the following infectious diseases.",
    items: [
      "HIV / AIDS",
      "Hepatitis B Surface Antigen (HBs Ag)",
      "Anti-HCV",
      "Malaria & Microfilaria",
      "Leprosy",
      "Tuberculosis",
      "Syphilis (VDRL / TPHA)",
    ],
  },
  {
    category: "Non-Infectious Conditions — Must Be Clear",
    description: "Candidates must not have the following non-infectious conditions.",
    items: [
      "No Chronic Renal Failure",
      "No Chronic Hepatic Failure",
      "No Congestive Heart Failure",
      "No Uncontrolled Hypertension",
      "No Psychiatric or Neurological Disorders",
      "No Pleural Effusion or Active TB Evidence",
    ],
  },
  {
    category: "Additional Requirements",
    description: "The following additional criteria must be met.",
    items: [
      "Pregnancy Test Must Be Negative",
      "HbA1C Below 10%",
      "Free from Drug Abuse (Opiates & Cannabis)",
    ],
  },
  {
    category: "Physical Fitness Requirements",
    description: "Candidates must meet basic physical fitness standards.",
    items: [
      "No Physical Deformities affecting work capability",
      "Adequate visual acuity (aided or unaided)",
      "Normal hearing ability",
      "Adequate musculoskeletal function",
    ],
  },
];

// Gallery images
export const facilityImages: { src: string; alt: string }[] = [
  { src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop", alt: "Reception area" },
  { src: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=600&h=600&fit=crop", alt: "Laboratory equipment" },
  { src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&h=400&fit=crop", alt: "X-ray room" },
  { src: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=600&fit=crop", alt: "Examination room" },
  { src: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop", alt: "Sample collection area" },
  { src: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&h=400&fit=crop", alt: "Patient waiting area" },
];

export const footerQuickLinks: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Our Services", href: "/services" },
  { label: "Fitness Criteria", href: "/fitness" },
  { label: "Report Search", href: "/reports" },
  { label: "News & Updates", href: "/news" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
];

export const footerServices: FooterLink[] = [
  { label: "Physical Examination", href: "/services/physical-examination" },
  { label: "Digital Radiology", href: "/services/digital-radiology" },
  { label: "Laboratory Tests", href: "/services/laboratory-tests" },
  { label: "Vaccination", href: "/services/vaccination" },
];

/** Fallback when Strapi is off; `logoUrl` empty shows text badge in UI. */
export const certificationBadges: {
  id: string;
  name: string;
  logoUrl: string;
  shortDescription?: string;
  verificationUrl?: string;
}[] = [
  { id: "mock-gamca", name: "GAMCA", logoUrl: "" },
  { id: "mock-bmet", name: "BMET", logoUrl: "" },
  { id: "mock-who", name: "WHO", logoUrl: "" },
  { id: "mock-kuwait", name: "MOH Kuwait", logoUrl: "" },
  { id: "mock-saudi", name: "MOH Saudi", logoUrl: "" },
  { id: "mock-uae", name: "MOH UAE", logoUrl: "" },
];

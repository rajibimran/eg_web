import type { BlogArticle } from "@/lib/api";

export const blogArticles: BlogArticle[] = [
  {
    slug: "gcc-medical-screening-guide",
    isFeatured: true,
    commentsOpen: true,
    author: { name: "Unicare Editorial", slug: "unicare-editorial" },
    readMinutes: 4,
    title: "Complete Guide to GCC Medical Screening",
    excerpt: "Everything you need to know about the medical screening process for overseas employment in GCC countries.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
    date: "April 5, 2026",
    category: "Guide",
    content:
      "GCC medical screening includes registration, sample collection, radiology, physician review, and reporting. Bring your passport and required documents, and follow fasting instructions when advised.",
  },
  {
    slug: "preparing-for-medical-checkup",
    commentsOpen: true,
    title: "How to Prepare for Your Medical Checkup",
    excerpt: "Tips and steps to follow before your medical examination to ensure accurate results and smooth processing.",
    image: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&h=400&fit=crop",
    date: "March 20, 2026",
    category: "Tips",
    content:
      "Prepare documents in advance, arrive early, and follow instructions from clinic staff. Adequate rest and hydration can help keep vital signs stable and reduce processing delays.",
  },
  {
    slug: "understanding-lab-results",
    title: "Understanding Your Lab Test Results",
    excerpt: "A simplified breakdown of common lab tests included in GCC medical screening and what the results mean.",
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&h=400&fit=crop",
    date: "March 10, 2026",
    category: "Education",
    content:
      "Common screening labs include hematology, serology, and basic chemistry panels. Your physician reviews all values against destination-country requirements before report finalization.",
  },
  {
    slug: "vaccination-requirements-gcc",
    title: "Vaccination Requirements for GCC Countries",
    excerpt: "An overview of mandatory vaccinations including MMR and Meningococcal for overseas employment.",
    image: "https://images.unsplash.com/photo-1615631648086-325025c9e51e?w=600&h=400&fit=crop",
    date: "February 28, 2026",
    category: "Guide",
    content:
      "Vaccine requirements vary by destination and visa class. Always verify latest guidance from the recruiting authority and complete required doses on schedule.",
  },
  {
    slug: "digital-xray-benefits",
    title: "Benefits of Digital X-Ray Technology",
    excerpt: "How modern digital radiography provides safer, faster, and more accurate imaging for medical screening.",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&h=400&fit=crop",
    date: "February 15, 2026",
    category: "Technology",
    content:
      "Digital radiology shortens turnaround time and improves consistency. High-quality image capture supports confident interpretation and faster report readiness.",
  },
  {
    slug: "fitness-criteria-explained",
    title: "GCC Fitness Criteria Explained",
    excerpt: "Detailed explanation of health requirements candidates must meet to receive fitness certification.",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
    date: "February 1, 2026",
    category: "Guide",
    content:
      "Fitness criteria focus on communicable diseases and significant medical conditions that can affect work fitness. Requirements differ by destination, so check current rules before appointment.",
  },
];

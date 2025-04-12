import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ProfileCard from "@/components/profile/profile-card";
import PostFilter from "@/components/feed/post-filter";
import PostCard from "@/components/feed/post-card";
import CreatePost from "@/components/feed/create-post";
import AppointmentCard from "@/components/appointments/appointment-card";
import DoctorCard from "@/components/doctors/doctor-card";
import HealthTopicsCard from "@/components/topics/health-topics-card";
import BookAppointmentModal from "@/components/appointments/book-appointment-modal";
import { Post, Appointment, DoctorWithProfile, User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [postFilter, setPostFilter] = useState("all");
  const [showBookAppointmentModal, setShowBookAppointmentModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | undefined>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);

  // Initialize with some visible posts
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      userId: 2,
      content: "Parents: Remember that flu season is approaching! Make sure to schedule vaccinations for your children early to ensure they're protected before winter arrives.",
      postType: "resource" as const,
      likes: 28,
      commentCount: 5,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: null,
      author: { name: "Dr. Michael Chen", role: "doctor" }
    },
    {
      id: 2,
      userId: 1,
      content: "Just published a new research paper on preventative cardiology approaches in the International Journal of Cardiology. Happy to answer any questions!",
      postType: "update" as const,
      likes: 42,
      commentCount: 8,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: null,
      author: { name: "Dr. Sarah Johnson", role: "doctor" }
    },
    {
      id: 3,
      userId: 5,
      content: "Has anyone tried yoga for chronic back pain? My doctor recommended it, and I'm curious about others' experiences.",
      postType: "question" as const,
      likes: 15,
      commentCount: 12,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Chronic Back Pain"],
      author: { name: "John Doe", role: "patient" }
    },
    {
      id: 4,
      userId: 3,
      content: "New study reveals promising results for early detection of Alzheimer's through a simple blood test. This breakthrough could allow for earlier interventions and better long-term outcomes.",
      postType: "resource" as const,
      likes: 52,
      commentCount: 17,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Alzheimer's Disease"],
      author: { name: "Dr. Emma Rodriguez", role: "doctor" }
    },
    {
      id: 5,
      userId: 6,
      content: "Had my first acupuncture session for rheumatoid arthritis pain yesterday. Feeling a bit better today! Has anyone else tried alternative therapies alongside conventional treatments?",
      postType: "question" as const,
      likes: 19,
      commentCount: 23,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Rheumatoid Arthritis"],
      author: { name: "Alice Smith", role: "patient" }
    },
    {
      id: 6,
      userId: 2,
      content: "Reminder for parents: Well-child visits are essential even when your child seems healthy. We monitor growth, development, and provide preventative care that keeps little ones thriving!",
      postType: "update" as const,
      likes: 36,
      commentCount: 7,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: null,
      author: { name: "Dr. Michael Chen", role: "doctor" }
    },
    {
      id: 7,
      userId: 7,
      content: "Two months post-cardiac surgery and completed my first 5k walk today! Slow and steady, but so proud of my progress. Thank you to my amazing medical team!",
      postType: "update" as const,
      likes: 67,
      commentCount: 31,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Coronary Artery Disease"],
      author: { name: "Robert Taylor", role: "patient" }
    },
    {
      id: 8,
      userId: 1,
      content: "Heart disease remains the leading cause of death worldwide. Know your risk factors: high blood pressure, high cholesterol, smoking, diabetes, obesity, physical inactivity, and family history.",
      postType: "resource" as const,
      likes: 45,
      commentCount: 13,
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      image: null,
      isAnonymous: false,
      relatedConditions: ["Heart Disease"],
      author: { name: "Dr. Sarah Johnson", role: "doctor" }
    },
    {
      id: 9,
      userId: 8,
      content: "Recently diagnosed with type 2 diabetes. Looking for advice on meal planning that won't make me feel deprived. Any tips from others managing this condition?",
      postType: "question" as const,
      likes: 22,
      commentCount: 27,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Type 2 Diabetes"],
      author: { name: "Patient 1", role: "patient" }
    },
    {
      id: 10,
      userId: 9,
      content: "Living with chronic migraines is exhausting. Finally found a neurologist who took my symptoms seriously. If you're suffering, don't give up on finding the right doctor!",
      postType: "update" as const,
      likes: 38,
      commentCount: 16,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Migraine"],
      author: { name: "Patient 2", role: "patient" }
    },
    {
      id: 11,
      userId: 3,
      content: "The connection between stress and neurological health is becoming increasingly clear. Regular stress-reduction practices like meditation may help protect brain function as we age.",
      postType: "resource" as const,
      likes: 41,
      commentCount: 9,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: null,
      author: { name: "Dr. Emma Rodriguez", role: "doctor" }
    },
    {
      id: 12,
      userId: 10,
      content: "My anxiety was through the roof before my first therapy session, but now it's the highlight of my week. If you're on the fence about seeking mental health support, this is your sign!",
      postType: "update" as const,
      likes: 53,
      commentCount: 19,
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      image: null,
      isAnonymous: false,
      relatedConditions: ["Anxiety Disorder"],
      author: { name: "Patient 3", role: "patient" }
    },
    {
      id: 13,
      userId: 11,
      content: "Started a daily gratitude practice as part of my depression management plan. It seemed silly at first, but three months in and I'm noticing a real difference in my outlook.",
      postType: "update" as const,
      likes: 47,
      commentCount: 14,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Depression"],
      author: { name: "Patient 4", role: "patient" }
    },
    {
      id: 14,
      userId: 2,
      content: "Childhood obesity rates continue to rise. Let's work together to encourage healthy habits: limit screen time, focus on nutrient-dense foods, and make physical activity fun for the whole family!",
      postType: "resource" as const,
      likes: 33,
      commentCount: 21,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: null,
      author: { name: "Dr. Michael Chen", role: "doctor" }
    },
    {
      id: 15,
      userId: 12,
      content: "Six months post-stroke and regained most of my speech! The human brain is truly remarkable. Don't underestimate the power of consistent therapy and a determined spirit.",
      postType: "update" as const,
      likes: 76,
      commentCount: 34,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Stroke"],
      author: { name: "Patient 5", role: "patient" }
    },
    {
      id: 16,
      userId: 13,
      content: "Recently diagnosed with celiac disease. The gluten-free learning curve is steep! Any recommendations for resources or cookbooks that helped others adjust?",
      postType: "question" as const,
      likes: 18,
      commentCount: 29,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Celiac Disease"],
      author: { name: "Patient 6", role: "patient" }
    },
    {
      id: 17,
      userId: 1,
      content: "Regular exercise is medicine for the heart. Just 30 minutes of moderate activity 5 days a week can significantly reduce your risk of cardiovascular disease.",
      postType: "resource" as const,
      likes: 39,
      commentCount: 11,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Heart Disease"],
      author: { name: "Dr. Sarah Johnson", role: "doctor" }
    },
    {
      id: 18,
      userId: 14,
      content: "Managing asthma during allergy season is challenging. My air purifier has been a game-changer for sleep quality. Any other tips from fellow asthmatics?",
      postType: "question" as const,
      likes: 24,
      commentCount: 18,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Asthma"],
      author: { name: "Patient 7", role: "patient" }
    },
    {
      id: 19,
      userId: 3,
      content: "Exciting research on neuroprotective compounds found in certain foods. Blueberries, fatty fish, nuts, and leafy greens all contain nutrients that may help maintain cognitive function as we age.",
      postType: "resource" as const,
      likes: 51,
      commentCount: 16,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: null,
      author: { name: "Dr. Emma Rodriguez", role: "doctor" }
    },
    {
      id: 20,
      userId: 15,
      content: "Three years managing Crohn's disease and finally found a treatment plan that works for me. Don't lose hope if you're still searching for relief - it can take time to find the right approach.",
      postType: "update" as const,
      likes: 44,
      commentCount: 22,
      createdAt: new Date(),
      image: null,
      isAnonymous: false,
      relatedConditions: ["Crohn's Disease"],
      author: { name: "Patient 8", role: "patient" }
    }
  ]);

  // Generate additional appointments and doctors
  useEffect(() => {
    // Generate appointments
    const generateAppointments = () => {
      const appointments = [];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Add base appointment
      appointments.push({
        id: 1,
        doctorId: 1,
        patientId: 5,
        date: nextWeek,
        status: "scheduled",
        reason: "Quarterly blood pressure check-up",
        notes: "Bring medication list",
        location: "Memorial Hospital, Room 302",
        isVirtual: false,
        createdAt: new Date()
      });
      
      // Generate 15 additional appointments
      for (let i = 2; i <= 16; i++) {
        // Random doctor between ID 1 and 30
        const doctorId = Math.floor(Math.random() * 30) + 1;
        
        // Random patient between ID 5 and 100
        const patientId = Math.floor(Math.random() * 95) + 5;
        
        // Random date within next 30 days
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 1);
        date.setHours(9 + Math.floor(Math.random() * 8)); // Between 9 AM and 5 PM
        date.setMinutes(Math.random() > 0.5 ? 0 : 30); // Either on the hour or half hour
        
        // Status
        const status = "scheduled";
        
        // Random reason
        const reasons = [
          "Annual physical check-up",
          "Follow-up on lab results",
          "Blood pressure monitoring",
          "Medication review",
          "Chronic pain management",
          "Diabetes management consultation",
          "Post-surgical follow-up",
          "Routine cancer screening",
          "Vaccination",
          "Allergy consultation"
        ];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        
        // Notes
        const notes = Math.random() > 0.5 ? "Bring current medication list" : null;
        
        // Location
        const locations = [
          "Memorial Hospital, Room 302",
          "Community Medical Center, Suite 105",
          "City General Hospital, Floor 4",
          "University Medical Center, Building B",
          "Downtown Health Clinic"
        ];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        // Virtual appointment
        const isVirtual = false;
        
        appointments.push({
          id: i,
          doctorId,
          patientId,
          date,
          status,
          reason,
          notes,
          location,
          isVirtual,
          createdAt: new Date()
        });
      }
      
      return appointments;
    };

    // Generate doctor data
    const generateDoctors = () => {
      const baseSpecialties = [
        { id: 1, specialty: "Cardiology", hospital: "Memorial Hospital" },
        { id: 2, specialty: "Pediatrics", hospital: "Children's Medical Center" },
        { id: 3, specialty: "Neurology", hospital: "University Medical Center" }
      ];
      
      const doctors = [
        {
          id: 1,
          name: "Dr. Sarah Johnson",
          username: "dr.sarah",
          password: "password123",
          email: "sarah@mediconnect.com",
          role: "doctor" as const,
          bio: "Cardiologist with 15 years of experience specializing in heart disease prevention and treatment.",
          profileImage: null,
          coverImage: null,
          createdAt: new Date(),
          profile: {
            id: 1,
            userId: 1,
            specialty: "Cardiology",
            hospital: "Memorial Hospital",
            qualifications: "MD, PhD, FACC",
            experience: 15,
            verified: true,
            rating: 4.8,
            reviewCount: 124
          }
        },
        {
          id: 2,
          name: "Dr. Michael Chen",
          username: "dr.michael",
          password: "password123",
          email: "michael@mediconnect.com",
          role: "doctor" as const,
          bio: "Pediatrician focused on early childhood development and preventative care.",
          profileImage: null,
          coverImage: null,
          createdAt: new Date(),
          profile: {
            id: 2,
            userId: 2,
            specialty: "Pediatrics",
            hospital: "Children's Medical Center",
            qualifications: "MD, FAAP",
            experience: 8,
            verified: true,
            rating: 4.9,
            reviewCount: 87
          }
        },
        {
          id: 3,
          name: "Dr. Emma Rodriguez",
          username: "dr.emma",
          password: "password123",
          email: "emma@mediconnect.com",
          role: "doctor" as const,
          bio: "Neurologist specializing in stroke recovery and neurodegenerative disorders.",
          profileImage: null,
          coverImage: null,
          createdAt: new Date(),
          profile: {
            id: 3,
            userId: 3,
            specialty: "Neurology",
            hospital: "University Medical Center",
            qualifications: "MD, PhD",
            experience: 12,
            verified: true,
            rating: 4.7,
            reviewCount: 92
          }
        }
      ];
      
      // Additional specialties
      const specialties = [
        { specialty: "Dermatology", qualifications: "MD, FAAD", hospital: "University Medical Center" },
        { specialty: "Orthopedics", qualifications: "MD, FAAOS", hospital: "City General Hospital" },
        { specialty: "Gastroenterology", qualifications: "MD, FACG", hospital: "Memorial Hospital" },
        { specialty: "Endocrinology", qualifications: "MD, FACE", hospital: "University Medical Center" },
        { specialty: "Ophthalmology", qualifications: "MD, FAAO", hospital: "Vision Care Center" },
        { specialty: "Psychiatry", qualifications: "MD, FAPA", hospital: "Behavioral Health Institute" },
        { specialty: "Oncology", qualifications: "MD, FASCO", hospital: "Cancer Treatment Center" },
        { specialty: "Rheumatology", qualifications: "MD, FACR", hospital: "Arthritis & Rheumatism Center" },
        { specialty: "Urology", qualifications: "MD, FACS", hospital: "City General Hospital" },
        { specialty: "Pulmonology", qualifications: "MD, FCCP", hospital: "Respiratory Care Center" },
        { specialty: "Family Medicine", qualifications: "MD, FAAFP", hospital: "Community Health Center" }
      ];
      
      // Names
      const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Amina", "Wei", "Raj", "Sofia", "Zara", "Omar", "Chen", "Priya", "Mohammed", "Aisha"];
      
      const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Patel", "Kim", "Gupta", "Yamamoto", "Singh", "Wong", "Ali", "Khan", "Chen"];
      
      // Generate additional doctors
      for (let i = 4; i <= 50; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `Dr. ${firstName} ${lastName}`;
        
        const specialtyInfo = specialties[Math.floor(Math.random() * specialties.length)];
        const experience = Math.floor(Math.random() * 20) + 3; // 3-23 years
        const rating = Math.round((3.5 + Math.random() * 1.5) * 10) / 10; // 3.5-5.0
        
        doctors.push({
          id: i,
          name,
          username: `dr.${firstName.toLowerCase()}${i}`,
          password: "password123",
          email: `${firstName.toLowerCase()}@mediconnect.com`,
          role: "doctor" as const,
          bio: `${specialtyInfo.specialty} specialist with ${experience} years of experience. Focused on patient-centered care and the latest evidence-based treatments.`,
          profileImage: null,
          coverImage: null,
          createdAt: new Date(),
          profile: {
            id: i,
            userId: i,
            specialty: specialtyInfo.specialty,
            hospital: specialtyInfo.hospital,
            qualifications: specialtyInfo.qualifications,
            experience,
            verified: true,
            rating,
            reviewCount: Math.floor(Math.random() * 150) + 10
          }
        });
      }
      
      return doctors;
    };
    
    // Set data
    setAppointments(generateAppointments());
    setDoctors(generateDoctors());
  }, []);

  // Filter posts based on selected filter
  const filteredPosts = posts.filter(post => {
    if (postFilter === "all") return true;
    if (postFilter === "doctors") return post.author?.role === "doctor";
    if (postFilter === "patients") return post.author?.role === "patient";
    if (postFilter === "conditions") {
      // This would filter by the current user's health conditions
      // For now, just return all posts
      return true;
    }
    return true;
  });

  const handleBookAppointment = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setShowBookAppointmentModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar - Profile Card */}
            <div className="lg:col-span-3">
              <ProfileCard user={user} />
            </div>
            
            {/* Main Content - Feed */}
            <div className="lg:col-span-6">
              <CreatePost />
              <PostFilter onFilterChange={setPostFilter} />
              
              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500 mb-2">No posts found</p>
                  <p className="text-sm text-gray-400">
                    {postFilter === "all" 
                      ? "Be the first to post something!" 
                      : "Try a different filter or create a new post."}
                  </p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onBookAppointment={handleBookAppointment}
                  />
                ))
              )}
              
              {filteredPosts.length > 0 && (
                <div className="text-center py-4">
                  <button className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition">
                    Load More
                  </button>
                </div>
              )}
            </div>
            
            {/* Right Sidebar */}
            <div className="lg:col-span-3">
              <AppointmentCard 
                appointments={appointments}
                doctors={doctors as unknown as User[]}
                userRole={user?.role as "doctor" | "patient"}
                onBookAppointment={() => setShowBookAppointmentModal(true)}
              />
              
              <DoctorCard 
                doctors={doctors}
                onBookAppointment={handleBookAppointment}
              />
              
              <HealthTopicsCard />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Book Appointment Modal */}
      <BookAppointmentModal 
        isOpen={showBookAppointmentModal} 
        onClose={() => setShowBookAppointmentModal(false)} 
        selectedDoctorId={selectedDoctorId}
      />
    </div>
  );
}